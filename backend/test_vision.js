const fs = require('fs');

async function testVision() {
  try {
    const formData = new FormData();
    // A 1x1 transparent PNG
    const dummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const blob = new Blob([Buffer.from(dummyImage, 'base64')], { type: 'image/png' });
    formData.append('image', blob, 'test.png');
    formData.append('prompt', 'Test prompt');

    const response = await fetch('http://localhost:5050/api/ai/vision', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testVision();
