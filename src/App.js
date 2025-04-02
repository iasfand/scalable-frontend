import React, { useState } from 'react';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const API_BASE = 'http://54.227.181.110:5000';

const fadeIn = keyframes`
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
`;

const Container = styled.div`
  min-height: 100vh;
  background: radial-gradient(circle at top left, #1a2a6c, #b21f1f, #fdbb2d);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Card = styled.div`
  background: #ffffff10;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 2.5rem 2rem;
  border-radius: 20px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
  max-width: 500px;
  width: 100%;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.8rem;
  color: #fff;
  margin-bottom: 1.2rem;
  text-shadow: 0 0 8px #000;
`;

const FileInput = styled.input`
  width: 100%;
  padding: 0.9rem;
  margin: 1rem 0 1.5rem;
  border: 2px dashed #fff;
  border-radius: 12px;
  background: transparent;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
`;

const Button = styled.button`
  padding: 0.9rem 2rem;
  margin: 0.5rem;
  background: linear-gradient(145deg, #00ffc8, #0fd9aa);
  border: none;
  border-radius: 50px;
  font-weight: bold;
  color: #000;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  &:disabled {
    background: #444;
    color: #ccc;
    cursor: not-allowed;
  }
`;

const Message = styled.p`
  color: ${({ type }) => (type === 'error' ? '#ff4d4d' : '#00ffc8')};
  margin-top: 1.2rem;
  font-weight: bold;
  font-size: 1rem;
`;

const App = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fileExt, setFileExt] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [crop, setCrop] = useState({ aspect: 1 });
  const [cropData, setCropData] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [imageElement, setImageElement] = useState(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const supportedExtensions = [
    ".txt", ".log", ".json", ".jpg", ".jpeg", ".png",
    ".webp", ".pdf", ".doc", ".docx"
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const ext = `.${selectedFile.name.split(".").pop().toLowerCase()}`;
    if (!supportedExtensions.includes(ext)) {
      setMessage("❌ Unsupported file type.");
      return;
    }

    setFile(selectedFile);
    setFileExt(ext);
    setMessage("");
    setCropData(null);             // Clear old crop
    setCroppedImage(null);         // Clear old cropped image
    setCrop({ aspect: 1 });        // Reset crop box

    if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      setImagePreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setImagePreviewUrl(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setLoading(true);
    setMessage("Compressing file...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`http://3.254.170.207:5000/compress`, formData, {
        responseType: "blob",
        headers: { "Content-Type": "multipart/form-data" },
      });

      const fileName = `compressed-${file.name}`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage("✅ File compressed and downloaded.");
    } catch (err) {
      console.error("Compression error:", err);
      setMessage("❌ Compression failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    setMessage("Converting file...");

    const formData = new FormData();
    formData.append("file", file);

    let endpoint = "";
    let outputName = "converted";

    if (fileExt === ".pdf") {
      endpoint = "/convert/pdf-to-docx";
      outputName = file.name.replace(/\.pdf$/, ".docx");
    } else if (fileExt === ".docx") {
      endpoint = "/convert/docx-to-pdf";
      outputName = file.name.replace(/\.docx$/, ".pdf");
    } else {
      setMessage("❌ Conversion is only available for PDF and DOCX.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}${endpoint}`, formData);
      const downloadUrl = `${API_BASE}${response.data.downloadUrl}`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", outputName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage("✅ File converted and downloaded.");
    } catch (err) {
      console.error("Conversion error:", err);
      setMessage("❌ Conversion failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCropComplete = (crop) => {
    if (!crop.width || !crop.height) return;
    setCropData(crop);
  };

  const onImageLoaded = (img) => {
    setImageElement(img);
  };
  const cropImageNow = async () => {
    if (!cropData || !naturalSize.width || !file) return alert("Please crop a valid area.");

    const imageElement = document.querySelector("img[src='" + imagePreviewUrl + "']");
    if (!imageElement) return alert("Image not found.");

    const scaleX = naturalSize.width / imageElement.clientWidth;
    const scaleY = naturalSize.height / imageElement.clientHeight;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("x", Math.round(cropData.x * scaleX));
    formData.append("y", Math.round(cropData.y * scaleY));
    formData.append("width", Math.round(cropData.width * scaleX));
    formData.append("height", Math.round(cropData.height * scaleY));

    setLoading(true);
    setMessage("Cropping image...");

    try {
      const response = await axios.post(`http://nodejs-alb-827956790.eu-west-1.elb.amazonaws.com/crop`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
      });

      const croppedUrl = URL.createObjectURL(response.data);
      setCroppedImage(croppedUrl);

      const link = document.createElement("a");
      link.href = croppedUrl;
      link.download = "cropped-image.png";
      link.click();

      setMessage("✅ Image cropped and downloaded.");
    } catch (err) {
      console.error("Crop error:", err);
      setMessage("❌ Crop failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Title>✨ File Tools: Compress & Convert</Title>
      <Card>
        <FileInput type="file" onChange={handleFileChange} accept={supportedExtensions.join(",")} />
        <Button onClick={handleCompress} disabled={!file || loading}>
          {loading ? "Processing..." : "Compress File"}
        </Button>
        {file && [".pdf", ".docx"].includes(fileExt) && (
          <Button onClick={handleConvert} disabled={loading}>
            {fileExt === ".pdf" ? "Convert to Word" : "Convert to PDF"}
          </Button>
        )}

        {imagePreviewUrl && (
          <>
            <ReactCrop
              crop={crop}
              onChange={setCrop}
              onComplete={handleCropComplete}
              aspect={1}
            >

              <img
                src={imagePreviewUrl}
                alt="To be cropped"
                style={{ maxWidth: '100%', marginTop: '1rem', borderRadius: '12px' }}
                onLoad={(e) => {
                  setNaturalSize({
                    width: e.target.naturalWidth,
                    height: e.target.naturalHeight
                  });
                }}
              />
            </ReactCrop>
            <Button onClick={cropImageNow} disabled={!cropData || loading}>
              Crop Image
            </Button>
          </>
        )}
        {croppedImage && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ color: '#fff' }}>Cropped Preview:</p>
            <img src={croppedImage} alt="Cropped" style={{ maxWidth: '100%', borderRadius: '12px' }} />
          </div>
        )}

        {message && <Message type={message.includes("❌") ? "error" : "success"}>{message}</Message>}
      </Card>
    </Container>
  );
};

export default App;
