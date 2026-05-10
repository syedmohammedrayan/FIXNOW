const { execSync } = require('child_process');

const port = process.argv[2] || 3000;

async function killPort() {
  try {
    if (process.platform === 'win32') {
      try {
        execSync(`powershell -Command "$p = (Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue).OwningProcess; if ($p) { Stop-Process -Id $p -Force }"`, { stdio: 'ignore' });
        console.log(`[FIXNOW] Successfully released port ${port} on Windows.`);
      } catch (err) {
        // Ignore errors if no process was using the port
      }
    } else {
      try {
        execSync(`lsof -t -i:${port} | xargs kill -9`);
      } catch (err) {
        // Ignore if already killed
      }
    }
    // Wait 1.5 seconds for OS to release port completely
    const start = Date.now();
    while (Date.now() - start < 1500) {}
  } catch (e) {
    // Port is likely already free
  }
}

killPort();
