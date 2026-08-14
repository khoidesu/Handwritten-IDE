import os
import base64
from flask import Flask, render_template, request, jsonify
from services.preprocess import process_image
from services.runner import execute
from config import TEMP_DIR
import judge0

app = Flask(__name__, template_folder='template', static_folder='static')

os.makedirs(TEMP_DIR, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run', methods=['POST'])
def run_code():
    data = request.json
    if not data or 'image' not in data:
        return jsonify({'error': 'No image data provided'}), 400
        
    image_data = data['image']
    # Remove the base64 prefix if present
    if ',' in image_data:
        image_data = image_data.split(',')[1]
        
    try:
        image_bytes = base64.b64decode(image_data)
        # Save to temp folder
        file_path = os.path.join(TEMP_DIR, 'captured_image.png')
        with open(file_path, 'wb') as f:
            f.write(image_bytes)
            
        # Pass path to preprocess.py
        result = process_image(file_path)
        
        final_result = execute(result)

        return jsonify({
            'message': 'Image saved and processed successfully',
            'result': result,
            'stdout': final_result.get('stdout'),
            'stderr': final_result.get('stderr'),
            'compile_output': final_result.get('compile_output')
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
