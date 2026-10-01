const BASE_URL = "http://127.0.0.1:5000";

export function createApp() {
  setTimeout(bindEvents, 0);

  return `
    <div class="container">
      <div class="page-header">
        <h1>Image Text Translator</h1>
        <p class="subtitle">
          Upload an image, detect text with AWS Rekognition,
          and translate it into your selected language.
        </p>
      </div>

      <div class="card">
        <div class="form-group">
          <label>Select Image</label>

          <label for="imageInput" class="upload-box">
            <span class="upload-title">Choose an image</span>
            <span id="fileName" class="upload-file-name">
              PNG, JPG or JPEG
            </span>
          </label>

          <input
            type="file"
            id="imageInput"
            accept="image/png,image/jpeg"
            hidden
          />
        </div>

        <div class="form-group">
          <label for="languageSelect">Target Language</label>

          <select id="languageSelect">
            <option value="zh">Chinese</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
            <option value="ja">Japanese</option>
            <option value="ar">Arabic</option>
            <option value="de">German</option>
          </select>
        </div>

        <div class="button-group">
          <button id="processBtn">Process Image</button>
          <button id="resetBtn" class="secondary">Reset</button>
        </div>

        <p id="statusMessage" class="status"></p>
        <p id="errorMessage" class="error"></p>
      </div>

      <div class="card">
        <h2>Image Preview</h2>

        <div class="preview-box">
          <img id="imagePreview" alt="Selected image preview" />

          <div id="previewPlaceholder" class="preview-placeholder">
            <span>No image selected</span>
          </div>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <h2>Detected Text</h2>

          <div id="detectedText" class="text-box">
            No text detected yet.
          </div>
        </div>

        <div class="card">
          <div class="header-row">
            <h2>Translated Text</h2>

            <button id="copyBtn" class="secondary small">
              Copy
            </button>
          </div>

          <div id="translatedText" class="text-box">
            No translation yet.
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindEvents() {
  const imageInput = document.getElementById("imageInput");
  const languageSelect = document.getElementById("languageSelect");
  const processBtn = document.getElementById("processBtn");
  const resetBtn = document.getElementById("resetBtn");
  const copyBtn = document.getElementById("copyBtn");

  const imagePreview = document.getElementById("imagePreview");
  const previewPlaceholder = document.getElementById("previewPlaceholder");
  const fileName = document.getElementById("fileName");

  const detectedText = document.getElementById("detectedText");
  const translatedText = document.getElementById("translatedText");

  const statusMessage = document.getElementById("statusMessage");
  const errorMessage = document.getElementById("errorMessage");

  imageInput?.addEventListener("change", previewImage);
  processBtn?.addEventListener("click", processImage);
  resetBtn?.addEventListener("click", resetAll);
  copyBtn?.addEventListener("click", copyText);

  function previewImage() {
    const file = imageInput.files[0];

    if (!file) {
      resetPreview();
      return;
    }

    fileName.textContent = file.name;

    const reader = new FileReader();

    reader.onload = function (event) {
      imagePreview.src = event.target.result;
      imagePreview.style.display = "block";
      previewPlaceholder.style.display = "none";
    };

    reader.readAsDataURL(file);
  }

  async function processImage() {
    clearMessages();

    const file = imageInput.files[0];
    const targetLanguage = languageSelect.value;

    if (!file) {
      showError("Please select an image.");
      return;
    }

    try {
      processBtn.disabled = true;
      processBtn.textContent = "Processing...";

      setStatus("Uploading image...");

      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(`${BASE_URL}/upload`, {
        method: "POST",
        body: formData
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || "Upload failed.");
      }

      const imageName = uploadData.image_name;

      setStatus("Detecting text and translating...");

      const translateResponse = await fetch(`${BASE_URL}/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image_name: imageName,
          target_language: targetLanguage
        })
      });

      const translateData = await translateResponse.json();

      if (!translateResponse.ok) {
        throw new Error(
          translateData.error || "Translation failed."
        );
      }

      detectedText.textContent =
        translateData.detected_text || "No text detected.";

      translatedText.textContent =
        translateData.translated_text || "No translation available.";

      setStatus("Completed successfully.");
    } catch (error) {
      showError(error.message || "Something went wrong.");
    } finally {
      processBtn.disabled = false;
      processBtn.textContent = "Process Image";
    }
  }

  function resetAll() {
    imageInput.value = "";
    languageSelect.value = "zh";

    resetPreview();

    detectedText.textContent = "No text detected yet.";
    translatedText.textContent = "No translation yet.";

    clearMessages();
  }

  function resetPreview() {
    imagePreview.src = "";
    imagePreview.style.display = "none";

    previewPlaceholder.style.display = "flex";
    fileName.textContent = "PNG, JPG or JPEG";
  }

  async function copyText() {
    const text = translatedText.textContent;

    if (
      !text ||
      text === "No translation yet." ||
      text === "No translation available."
    ) {
      showError("Nothing to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);

      const oldText = copyBtn.textContent;
      copyBtn.textContent = "Copied!";

      setTimeout(() => {
        copyBtn.textContent = oldText;
      }, 1500);
    } catch {
      showError("Failed to copy text.");
    }
  }

  function setStatus(message) {
    statusMessage.textContent = message;
    errorMessage.textContent = "";
  }

  function showError(message) {
    errorMessage.textContent = message;
    statusMessage.textContent = "";
  }

  function clearMessages() {
    statusMessage.textContent = "";
    errorMessage.textContent = "";
  }
}