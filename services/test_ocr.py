import cv2
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import config
from ocr import recognize

print("1. Import xong")

img_path = os.path.join(config.TEMP_DIR, "captured_image.png")
img = cv2.imread(img_path)
print("2. Đọc ảnh:", img is not None)

text = recognize(img)

print("3. OCR xong")
print("Text là: ")
print(text)