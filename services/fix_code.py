import os
# pyrefly: ignore [missing-import]
import google.generativeai as genai

def fix_code_with_gemini(raw_text: str) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Warning: Không tìm thấy GEMINI_API_KEY trong biến môi trường. Trả về text gốc.")
        return raw_text
        
    genai.configure(api_key=api_key)
        
    system_prompt = """
    Bạn là một chuyên gia lập trình và sửa lỗi nhận diện chữ viết tay (OCR).
    Đầu vào là văn bản được nhận dạng từ mã nguồn viết tay, thường chứa lỗi nhận diện như:
    - Sai ký tự, sai chính tả (ví dụ: '1' thành 'l', '0' thành 'o', 'print' thành 'pr1nt', v.v.).
    - Sai thụt lề, mất dấu câu, hoặc thiếu ngoặc.
    
    Nhiệm vụ của bạn là:
    - Đoán ngôn ngữ lập trình đang được sử dụng (Python).
    - Sửa lại các lỗi nhận diện để tạo ra đoạn code chạy được, chuẩn cú pháp.
    - Format (định dạng) lại code cho dễ nhìn và đúng chuẩn.
    - CHỈ trả về đúng phần mã nguồn đã được sửa, tuyệt đối KHÔNG trả về các lời giải thích hay markdown block (như ```python ... ```) để có thể hiển thị trực tiếp.
    """
    
    try:
        model = genai.GenerativeModel('gemini-3.5-flash', system_instruction=system_prompt)
        response = model.generate_content(raw_text)
        
        # Xóa markdown nếu Gemini vẫn cố tình trả về
        result = response.text.strip()
        if result.startswith("```") and result.endswith("```"):
            lines = result.split("\n")
            result = "\n".join(lines[1:-1]).strip()
        print("thành công.....")
        return result
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return raw_text
