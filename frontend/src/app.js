const BASE_URL = "http://127.0.0.1:5000";

export function createApp() {
  setTimeout(bindEvents, 0);

  return `
    <div class="container">
      <h1>Image Text Translator</h1>
      <p class="subtitle">
        Upload an image, detect text, and translate it into your selected language.
      </p>

      <div class="card">
        <label>Select Image</label>
        <input type="file" id="imageInput" accept="image/*" />

        <label>Target Language</label>
        <select id="languageSelect">
          <option value="zh">Chinese</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          <option value="ja">Japanese</option>
          <option value="ar">Arabic</option>
          <option value="de">German</option>
        </select>

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
          <img id="imagePreview" alt="Preview" />
          <p id="previewPlaceholder">No image selected</p>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <h2>Detected Text</h2>
          <div id="detectedText" class="text-box">No text detected yet.</div>
        </div>

        <div class="card">
          <div class="header-row">
            <h2>Translated Text</h2>
            <button id="copyBtn" class="secondary small">Copy</button>
          </div>
          <div id="translatedText" class="text-box">No translation yet.</div>
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
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      imagePreview.src = e.target.result;
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
        throw new Error(translateData.error || "Translation failed.");
      }

      detectedText.textContent = translateData.detected_text || "No text detected.";
      translatedText.textContent = translateData.translated_text || "No translation available.";

      setStatus("Completed successfully.");
    } catch (error) {
      showError(error.message || "Something went wrong.");
    }
  }

  function resetAll() {
    imageInput.value = "";
    languageSelect.value = "zh";
    imagePreview.src = "";
    imagePreview.style.display = "none";
    previewPlaceholder.style.display = "block";
    detectedText.textContent = "No text detected yet.";
    translatedText.textContent = "No translation yet.";
    clearMessages();
  }

  function copyText() {
    const text = translatedText.textContent;

    if (!text || text === "No translation yet.") {
      showError("Nothing to copy.");
      return;
    }

    navigator.clipboard.writeText(text)
      .then(() => setStatus("Copied to clipboard."))
      .catch(() => showError("Failed to copy text."));
  }

  function setStatus(msg) {
    statusMessage.textContent = msg;
    errorMessage.textContent = "";
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    statusMessage.textContent = "";
  }

  function clearMessages() {
    statusMessage.textContent = "";
    errorMessage.textContent = "";
  }
}