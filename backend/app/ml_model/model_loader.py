import os
import numpy as np
import sentencepiece as spm
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

# ── Paths ──
BASE_DIR = os.path.dirname(__file__)
TONE_MODEL_DIR = os.path.join(BASE_DIR, "tone_model")
TRANSLATOR_DIR = os.path.join(BASE_DIR, "translator")
SPM_MODEL_PATH = os.path.join(TRANSLATOR_DIR, "spm_bpe.model")
KERAS_MODEL_PATH = os.path.join(TRANSLATOR_DIR, "transformer_translator_model.keras")

# ── Load T5 tone model ──
print("Loading T5 tone model...")
tone_model = AutoModelForSeq2SeqLM.from_pretrained(TONE_MODEL_DIR)
tone_tokenizer = AutoTokenizer.from_pretrained(TONE_MODEL_DIR)
print("Tone model ready!")

# ── Load SentencePiece tokenizer ──
print("Loading SentencePiece tokenizer...")
sp = spm.SentencePieceProcessor()
sp.load(SPM_MODEL_PATH)
print(f"SentencePiece ready! Vocab size: {sp.get_piece_size()}")

# ── Load Keras translator model ──
print("Loading Keras translator model...")
import tensorflow as tf
import keras
from keras.saving import register_keras_serializable

SEQ_LEN = 64
BOS_ID = sp.bos_id()
EOS_ID = sp.eos_id()
PAD_ID = 0


class PositionalEmbedding(keras.layers.Layer):
    def __init__(self, seq_len, vocab_size, embed_dim, **kwargs):
        super().__init__(**kwargs)
        self.supports_masking = True
        self.token_emb = keras.layers.Embedding(vocab_size, embed_dim)
        self.pos_emb = keras.layers.Embedding(seq_len, embed_dim)
        self.seq_len = seq_len
        self.vocab_size = vocab_size
        self.embed_dim = embed_dim
    def call(self, x):
        length = tf.shape(x)[-1]
        positions = tf.range(length)
        return self.token_emb(x) + self.pos_emb(positions)
    def compute_mask(self, x, mask=None):
        return tf.math.not_equal(x, 0)
    def get_config(self):
        cfg = super().get_config()
        cfg.update({"seq_len": self.seq_len, "vocab_size": self.vocab_size, "embed_dim": self.embed_dim})
        return cfg

class TransformerEncoder(keras.layers.Layer):
    def __init__(self, embed_dim, dense_dim, num_heads, **kwargs):
        super().__init__(**kwargs)
        self.supports_masking = True
        self.attn = keras.layers.MultiHeadAttention(num_heads=num_heads, key_dim=embed_dim)
        self.ffn = keras.Sequential([keras.layers.Dense(dense_dim, activation="relu"), keras.layers.Dense(embed_dim)])
        self.norm1 = keras.layers.LayerNormalization()
        self.norm2 = keras.layers.LayerNormalization()
        self.embed_dim = embed_dim
        self.dense_dim = dense_dim
        self.num_heads = num_heads
    def call(self, x, mask=None):
        return self.norm2(x + self.ffn(self.norm1(x + self.attn(x, x, x))))
    def get_config(self):
        cfg = super().get_config()
        cfg.update({"embed_dim": self.embed_dim, "dense_dim": self.dense_dim, "num_heads": self.num_heads})
        return cfg

class TransformerDecoder(keras.layers.Layer):
    def __init__(self, embed_dim, dense_dim, num_heads, **kwargs):
        super().__init__(**kwargs)
        self.supports_masking = True
        self.attn1 = keras.layers.MultiHeadAttention(num_heads=num_heads, key_dim=embed_dim)
        self.attn2 = keras.layers.MultiHeadAttention(num_heads=num_heads, key_dim=embed_dim)
        self.ffn = keras.Sequential([keras.layers.Dense(dense_dim, activation="relu"), keras.layers.Dense(embed_dim)])
        self.norm1 = keras.layers.LayerNormalization()
        self.norm2 = keras.layers.LayerNormalization()
        self.norm3 = keras.layers.LayerNormalization()
        self.embed_dim = embed_dim
        self.dense_dim = dense_dim
        self.num_heads = num_heads
    def call(self, x, enc_out, mask=None):
        x = self.norm1(x + self.attn1(x, x, x, use_causal_mask=True))
        x = self.norm2(x + self.attn2(x, enc_out, enc_out))
        return self.norm3(x + self.ffn(x))
    def get_config(self):
        cfg = super().get_config()
        cfg.update({"embed_dim": self.embed_dim, "dense_dim": self.dense_dim, "num_heads": self.num_heads})
        return cfg

class TranslatorModel(keras.Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.enc_emb = PositionalEmbedding(SEQ_LEN, 8000, 256)
        self.encoder = TransformerEncoder(256, 512, 8)
        self.dec_emb = PositionalEmbedding(SEQ_LEN, 8000, 256)
        self.decoder = TransformerDecoder(256, 512, 8)
        self.out = keras.layers.Dense(8000)
    def call(self, inputs, training=False):
        enc_in, dec_in = inputs
        enc_out = self.encoder(self.enc_emb(enc_in))
        dec_out = self.decoder(self.dec_emb(dec_in), enc_out)
        return self.out(dec_out)

from keras.models import load_model

def masked_loss(y_true, y_pred):
    import tensorflow as tf
    loss = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True, reduction='none')(y_true, y_pred)
    mask = tf.cast(tf.not_equal(y_true, 0), tf.float32)
    return tf.reduce_sum(loss * mask) / tf.reduce_sum(mask)

def masked_accuracy(y_true, y_pred):
    import tensorflow as tf
    y_pred = tf.cast(tf.argmax(y_pred, axis=-1), tf.int32)
    y_true = tf.cast(y_true, tf.int32)
    mask = tf.cast(tf.not_equal(y_true, 0), tf.float32)
    return tf.reduce_sum(tf.cast(tf.equal(y_true, y_pred), tf.float32) * mask) / tf.reduce_sum(mask)

translator_model = load_model(
    KERAS_MODEL_PATH,
    custom_objects={
        "PositionalEmbedding": PositionalEmbedding,
        "TransformerEncoder": TransformerEncoder,
        "TransformerDecoder": TransformerDecoder,
        "TranslatorModel": TranslatorModel,
        "masked_loss": masked_loss,
        "masked_accuracy": masked_accuracy,
    }
)
print("Translator model ready!")

# ── Translation function ──
def translate_text(text: str) -> str:
    encoder_input = np.array(
        [[BOS_ID] + sp.encode(text, out_type=int)[:SEQ_LEN-2] + [EOS_ID]]
    )
    pad_len = SEQ_LEN - encoder_input.shape[1]
    if pad_len > 0:
        encoder_input = np.pad(encoder_input, ((0,0),(0,pad_len)))
    encoder_input = encoder_input[:, :SEQ_LEN]

    decoded_tokens = [BOS_ID]
    for _ in range(SEQ_LEN):
        dec_input = np.array(
            [decoded_tokens + [PAD_ID] * (SEQ_LEN - len(decoded_tokens))]
        )
        predictions = translator_model.predict(
            [encoder_input, dec_input], verbose=0
        )
        next_token = int(np.argmax(predictions[0, len(decoded_tokens) - 1]))
        if next_token == EOS_ID:
            break
        decoded_tokens.append(next_token)

    flat = [int(t) for t in decoded_tokens[1:] if t != PAD_ID]
    return sp.decode(flat)

# ── Getters ──
def get_model_and_tokenizer():
    return tone_model, tone_tokenizer

def get_translator():
    return translate_text