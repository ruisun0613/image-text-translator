import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

from services.storage_service import StorageService
from services.recognition_service import RecognitionService
from services.translation_service import TranslationService

app = Flask(__name__)
CORS(app)

BUCKET_NAME = "image-text-translator"
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

storage_service = StorageService(bucket_name=BUCKET_NAME)
recognition_service = RecognitionService()
translation_service = TranslationService()


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Image Text Translator API is running."})


@app.route("/upload", methods=["POST"])
def upload_image():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request."}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file type."}), 400

    filename = secure_filename(file.filename)
    local_path = os.path.join(UPLOAD_FOLDER, filename)

    try:
        file.save(local_path)

        image_name = storage_service.upload_file(local_path, filename)

        if not image_name:
            return jsonify({"error": "Upload to S3 failed."}), 500

        return jsonify({
            "message": "Upload successful.",
            "image_name": image_name
        }), 200

    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500


@app.route("/translate", methods=["POST"])
def translate_image_text():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Missing JSON body."}), 400

    image_name = data.get("image_name")
    target_language = data.get("target_language", "zh")

    if not image_name:
        return jsonify({"error": "Missing image_name."}), 400

    try:
        detected_text = recognition_service.detect_text(BUCKET_NAME, image_name)

        if not detected_text:
            return jsonify({"error": "No text detected in the image."}), 400

        translated_text = translation_service.translate_text(
            detected_text,
            target_language
        )

        if not translated_text:
            return jsonify({"error": "Translation failed."}), 500

        return jsonify({
            "image_name": image_name,
            "detected_text": detected_text,
            "translated_text": translated_text,
            "target_language": target_language
        }), 200

    except Exception as e:
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True)