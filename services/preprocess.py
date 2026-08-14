import os
import cv2
import numpy as np
import glob
from services.ocr import recognize
from config import TEMP_DIR

def segment_lines(img: np.ndarray) -> list:
    """
    Phân tách ảnh chứa nhiều dòng text thành các ảnh từng dòng.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)
    
    # Calculate horizontal projection
    proj = np.sum(thresh, axis=1)
    
    lines = []
    in_line = False
    start_y = 0
    pad = 10
    
    for y in range(len(proj)):
        if proj[y] > 0 and not in_line:
            in_line = True
            start_y = y
        elif proj[y] == 0 and in_line:
            in_line = False
            end_y = y
            if end_y - start_y > 10: # filter out noise
                y1 = max(0, start_y - pad)
                y2 = min(img.shape[0], end_y + pad)
                
                line_thresh = thresh[y1:y2, :]
                col_proj = np.sum(line_thresh, axis=0)
                nonzero_cols = np.nonzero(col_proj)[0]
                
                if len(nonzero_cols) > 0:
                    x1 = max(0, nonzero_cols[0] - pad)
                    x2 = min(img.shape[1], nonzero_cols[-1] + pad)
                    lines.append(img[y1:y2, x1:x2])
                    
    if in_line:
        end_y = len(proj)
        if end_y - start_y > 10:
            y1 = max(0, start_y - pad)
            y2 = min(img.shape[0], end_y + pad)
            
            line_thresh = thresh[y1:y2, :]
            col_proj = np.sum(line_thresh, axis=0)
            nonzero_cols = np.nonzero(col_proj)[0]
            
            if len(nonzero_cols) > 0:
                x1 = max(0, nonzero_cols[0] - pad)
                x2 = min(img.shape[1], nonzero_cols[-1] + pad)
                lines.append(img[y1:y2, x1:x2])
                
    if not lines:
        lines = [img]
        
    return lines


def process_image(image_path: str) -> str:
    """
    Tiền xử lý ảnh được lưu từ frontend.
    
    Args:
        image_path (str): Đường dẫn tới ảnh đã lưu trong thư mục temp.
        
    Returns:
        str: Kết quả xử lý hoặc thông báo.
    """
    if not os.path.exists(image_path):
        return f"Lỗi: Không tìm thấy ảnh tại {image_path}"
    
    img = cv2.imread(image_path)    

    if img is None:
        raise ValueError("Không thể đọc ảnh bằng OpenCV.")
    
    line_images = segment_lines(img)
    
    # Xoá các ảnh từng dòng của lần chạy trước
    for old_file in glob.glob(os.path.join(TEMP_DIR, 'captured_image_*.png')):
        # Bỏ qua ảnh gốc
        if os.path.basename(old_file) == 'captured_image.png':
            continue
        try:
            os.remove(old_file)
        except OSError:
            pass
            
    recognized_texts = []
    for idx, line_img in enumerate(line_images, start=1):
        line_path = os.path.join(TEMP_DIR, f'captured_image_{idx}.png')
        cv2.imwrite(line_path, line_img)
        
        text = recognize(line_img)
        recognized_texts.append(text)
        
    raw_text = "\n".join(recognized_texts)
    
    # Sử dụng Gemini API để sửa lỗi nhận diện chữ và format lại code
    from services.fix_code import fix_code_with_gemini
    fixed_text = fix_code_with_gemini(raw_text)

    print("Raw text:")
    print(raw_text)
    print("Fixed text:")
    print(fixed_text)

    return fixed_text
