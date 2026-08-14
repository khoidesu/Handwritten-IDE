# pyrefly: ignore [missing-import]
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
# pyrefly: ignore [missing-import]
import torch
# pyrefly: ignore [missing-import]
from PIL import Image
import cv2
from config import TROCR_MODEL_PATH

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

processor = TrOCRProcessor.from_pretrained(
    TROCR_MODEL_PATH
)

model = VisionEncoderDecoderModel.from_pretrained(
    TROCR_MODEL_PATH
).to(device)

def recognize(img):
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    image = Image.fromarray(rgb)

    pixel_values = processor(
        image,
        return_tensors="pt"
    ).pixel_values.to(device)

    generated_ids = model.generate(pixel_values)

    text = processor.batch_decode(
        generated_ids,
        skip_special_tokens=True
    )[0]

    return text