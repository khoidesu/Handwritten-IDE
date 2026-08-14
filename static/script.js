try {
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          tertiary: "#5d5e5f",
          "tertiary-container": "#999999",
          "on-secondary-container": "#646464",
          "surface-tint": "#a43e00",
          "tertiary-fixed": "#e3e2e2",
          "surface-container-lowest": "#ffffff",
          "surface-container-high": "#e8e8e8",
          "inverse-primary": "#ffb596",
          "on-surface": "#1a1c1c",
          "on-error": "#ffffff",
          primary: "#a43e00",
          "on-tertiary-container": "#303132",
          "primary-fixed-dim": "#ffb596",
          "error-container": "#ffdad6",
          secondary: "#5e5e5e",
          "surface-variant": "#e2e2e2",
          "surface-bright": "#f9f9f9",
          "on-secondary-fixed": "#1b1b1b",
          "secondary-fixed-dim": "#c6c6c6",
          "surface-container-low": "#f4f3f3",
          "on-primary-fixed-variant": "#7d2d00",
          "on-background": "#1a1c1c",
          "surface-dim": "#dadada",
          "on-primary": "#ffffff",
          "primary-fixed": "#ffdbcd",
          "secondary-container": "#e2e2e2",
          "inverse-on-surface": "#f1f1f1",
          "on-error-container": "#93000a",
          "tertiary-fixed-dim": "#c6c6c6",
          "on-tertiary-fixed-variant": "#464747",
          error: "#ba1a1a",
          "primary-container": "#ff6b1a",
          "on-surface-variant": "#5a4137",
          surface: "#f9f9f9",
          "inverse-surface": "#2f3131",
          "on-tertiary-fixed": "#1a1c1c",
          "on-secondary": "#ffffff",
          "on-secondary-fixed-variant": "#474747",
          "secondary-fixed": "#e2e2e2",
          "on-primary-fixed": "#360f00",
          "surface-container-highest": "#e2e2e2",
          "surface-container": "#eeeeee",
          "on-primary-container": "#591e00",
          "outline-variant": "#e2bfb2",
          outline: "#8e7165",
          background: "#f9f9f9",
          "on-tertiary": "#ffffff",
          "grid-line": "#bdbdbd",
          "grid-border": "#000000",
        },
        borderRadius: {
          DEFAULT: "0.25rem",
          lg: "0.5rem",
          xl: "0.75rem",
          full: "9999px",
          none: "0px",
        },
        spacing: {
          "margin-page": "40px",
          "stack-lg": "48px",
          gutter: "1px",
          "stack-sm": "8px",
          unit: "4px",
          "stack-md": "24px",
        },
        fontFamily: {
          "body-md": ["JetBrains Mono"],
          "headline-lg": ["Space Grotesk"],
          "label-sm": ["JetBrains Mono"],
          "headline-lg-mobile": ["Space Grotesk"],
          "display-xl": ["Space Grotesk"],
        },
        fontSize: {
          "body-md": [
            "16px",
            {
              lineHeight: "24px",
              fontWeight: "400",
            },
          ],
          "headline-lg": [
            "48px",
            {
              lineHeight: "52px",
              letterSpacing: "-0.02em",
              fontWeight: "700",
            },
          ],
          "label-sm": [
            "12px",
            {
              lineHeight: "16px",
              letterSpacing: "0.1em",
              fontWeight: "500",
            },
          ],
          "headline-lg-mobile": [
            "32px",
            {
              lineHeight: "36px",
              fontWeight: "700",
            },
          ],
          "display-xl": [
            "120px",
            {
              lineHeight: "100px",
              letterSpacing: "-0.04em",
              fontWeight: "700",
            },
          ],
        },
      },
    },
  };
} catch (_e) {}

document.addEventListener('DOMContentLoaded', () => {
  let currentMode = 'pen'; // 'pen', 'eraser', 'pan'
  const instances = [];

  const penBtn = document.getElementById('tool-pen');
  const eraserBtn = document.getElementById('tool-eraser');
  const panBtn = document.getElementById('tool-pan');
  const statusText = document.querySelector('aside .mt-auto span.truncate');

  function updateToolUI() {
    const btns = [penBtn, eraserBtn, panBtn];
    const inactiveClass = "w-full aspect-square flex flex-col items-center justify-center text-on-surface-variant hover:bg-secondary-container transition-colors cursor-crosshair group";
    const activeClass = "w-full aspect-square flex flex-col items-center justify-center bg-primary text-on-primary font-bold hover:bg-secondary-container hover:text-on-surface transition-colors cursor-crosshair group";
    
    btns.forEach(btn => { if (btn) btn.className = inactiveClass; });

    if (currentMode === 'pen' && penBtn) {
      penBtn.className = activeClass;
      if (statusText) statusText.textContent = "READY_TO_DRAW";
    } else if (currentMode === 'eraser' && eraserBtn) {
      eraserBtn.className = activeClass;
      if (statusText) statusText.textContent = "ERASER_ACTIVE";
    } else if (currentMode === 'pan' && panBtn) {
      panBtn.className = activeClass;
      if (statusText) statusText.textContent = "PAN_ACTIVE";
    }
    
    instances.forEach(inst => inst.updateCursor());
  }

  if (penBtn) penBtn.addEventListener('click', () => { currentMode = 'pen'; updateToolUI(); });
  if (eraserBtn) eraserBtn.addEventListener('click', () => { currentMode = 'eraser'; updateToolUI(); });
  if (panBtn) panBtn.addEventListener('click', () => { currentMode = 'pan'; updateToolUI(); });

  class InfiniteCanvas {
    constructor(canvasId, containerId) {
      this.canvas = document.getElementById(canvasId);
      this.container = document.getElementById(containerId);
      if (!this.canvas) return;
      
      this.ctx = this.canvas.getContext('2d');
      this.strokes = [];
      this.currentStroke = null;
      this.isDrawing = false;
      this.isPanning = false;
      this.lastPanPoint = { x: 0, y: 0 };
      this.cameraOffset = { x: 0, y: 0 };
      this.cameraZoom = 1;

      this.resizeCanvas = this.resizeCanvas.bind(this);
      window.addEventListener('resize', this.resizeCanvas);
      setTimeout(this.resizeCanvas, 10);

      this.bindEvents();
      instances.push(this);
    }

    clear() {
      this.strokes = [];
      this.redraw();
    }

    updateCursor() {
      if (!this.canvas) return;
      if (currentMode === 'pan') {
        this.canvas.style.cursor = 'grab';
      } else {
        this.canvas.style.cursor = 'crosshair';
      }
    }

    resizeCanvas() {
      if (!this.canvas) return;
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
      this.redraw();
    }

    zoomAt(screenX, screenY, zoomAmount) {
      const newZoom = this.cameraZoom * zoomAmount;
      this.cameraOffset.x = screenX - (screenX - this.cameraOffset.x) * zoomAmount;
      this.cameraOffset.y = screenY - (screenY - this.cameraOffset.y) * zoomAmount;
      this.cameraZoom = newZoom;
      this.redraw();
    }

    getWorldPos(e) {
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      return {
        x: (screenX - this.cameraOffset.x) / this.cameraZoom,
        y: (screenY - this.cameraOffset.y) / this.cameraZoom
      };
    }

    bindEvents() {
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.ctrlKey) {
          const zoomAmount = e.deltaY > 0 ? (1 / 1.1) : 1.1;
          const rect = this.canvas.getBoundingClientRect();
          this.zoomAt(e.clientX - rect.left, e.clientY - rect.top, zoomAmount);
        } else {
          this.cameraOffset.x -= e.deltaX;
          this.cameraOffset.y -= e.deltaY;
          this.redraw();
        }
      }, { passive: false });

      this.canvas.addEventListener('pointerdown', (e) => {
        if (e.button === 1 || currentMode === 'pan') {
          this.isPanning = true;
          this.lastPanPoint = { x: e.clientX, y: e.clientY };
          this.canvas.style.cursor = 'grabbing';
          this.canvas.setPointerCapture(e.pointerId);
          return;
        }

        this.isDrawing = true;
        const worldPos = this.getWorldPos(e);
        if (currentMode === 'pen') {
          const isDark = document.documentElement.classList.contains('dark');
          this.currentStroke = {
            points: [worldPos],
            color: isDark ? '#ffffff' : '#1a1c1c', 
            width: 3 
          };
          this.strokes.push(this.currentStroke);
          this.redraw();
        } else if (currentMode === 'eraser') {
          this.eraseAt(worldPos);
        }
        this.canvas.setPointerCapture(e.pointerId);
      });

      this.canvas.addEventListener('pointermove', (e) => {
        if (this.isPanning) {
          this.cameraOffset.x += (e.clientX - this.lastPanPoint.x);
          this.cameraOffset.y += (e.clientY - this.lastPanPoint.y);
          this.lastPanPoint = { x: e.clientX, y: e.clientY };
          this.redraw();
          return;
        }

        if (!this.isDrawing) return;
        const worldPos = this.getWorldPos(e);
        if (currentMode === 'pen' && this.currentStroke) {
          this.currentStroke.points.push(worldPos);
          this.redraw(); 
        } else if (currentMode === 'eraser') {
          this.eraseAt(worldPos);
        }
      });

      const stopPointer = (e) => {
        if (this.isPanning) {
          this.isPanning = false;
          this.updateCursor();
          this.canvas.releasePointerCapture(e.pointerId);
        }
        if (this.isDrawing) {
          this.isDrawing = false;
          this.currentStroke = null;
          this.canvas.releasePointerCapture(e.pointerId);
        }
      };

      this.canvas.addEventListener('pointerup', stopPointer);
      this.canvas.addEventListener('pointercancel', stopPointer);
      this.canvas.addEventListener('pointerout', stopPointer);
    }

    eraseAt(worldPos) {
      const threshold = 15 / this.cameraZoom; 
      let strokeRemoved = false;
      this.strokes = this.strokes.filter(stroke => {
        const hit = stroke.points.some(p => {
          const dx = p.x - worldPos.x;
          const dy = p.y - worldPos.y;
          return Math.sqrt(dx * dx + dy * dy) < threshold;
        });
        if (hit) strokeRemoved = true;
        return !hit;
      });

      if (strokeRemoved) {
        this.redraw();
      }
    }

    redraw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      if (this.container) {
        const bgSize = 20 * this.cameraZoom;
        this.container.style.backgroundSize = `${bgSize}px ${bgSize}px`;
        this.container.style.backgroundPosition = `${this.cameraOffset.x}px ${this.cameraOffset.y}px`;
      }

      this.ctx.save();
      this.ctx.translate(this.cameraOffset.x, this.cameraOffset.y);
      this.ctx.scale(this.cameraZoom, this.cameraZoom);
      
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      const isDark = document.documentElement.classList.contains('dark');
      for (const stroke of this.strokes) {
        if (stroke.points.length === 0) continue;
        this.ctx.beginPath();
        let displayColor = stroke.color;
        if (displayColor === '#1a1c1c' && isDark) {
          displayColor = '#ffffff';
        } else if (displayColor === '#ffffff' && !isDark) {
          displayColor = '#1a1c1c';
        }
        this.ctx.strokeStyle = displayColor;
        this.ctx.lineWidth = stroke.width; 
        this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        this.ctx.stroke();
      }
      
      this.ctx.restore();
    }
  }

  const mainCanvas = new InfiniteCanvas('drawing-canvas', 'canvas-container');

  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  
  if (zoomInBtn) zoomInBtn.addEventListener('click', () => {
    if(mainCanvas.canvas) {
      const cx = mainCanvas.canvas.width / 2;
      const cy = mainCanvas.canvas.height / 2;
      mainCanvas.zoomAt(cx, cy, 1.2);
    }
  });
  
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => {
    if(mainCanvas.canvas) {
      const cx = mainCanvas.canvas.width / 2;
      const cy = mainCanvas.canvas.height / 2;
      mainCanvas.zoomAt(cx, cy, 1 / 1.2);
    }
  });

  const runBtn = document.getElementById('run-btn');
  if (runBtn) {
    runBtn.addEventListener('click', () => {
      const strokes = mainCanvas.strokes;
      if (!strokes || strokes.length === 0) {
        alert("Canvas trống!");
        return;
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let hasPoints = false;

      for (const stroke of strokes) {
        for (const p of stroke.points) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
          hasPoints = true;
        }
      }

      if (!hasPoints) {
        alert("Canvas trống!");
        return;
      }

      const padding = 20;
      const width = maxX - minX + padding * 2;
      const height = maxY - minY + padding * 2;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tCtx = tempCanvas.getContext('2d');

      tCtx.fillStyle = '#ffffff';
      tCtx.fillRect(0, 0, width, height);
      tCtx.lineCap = 'round';
      tCtx.lineJoin = 'round';

      for (const stroke of strokes) {
        if (stroke.points.length === 0) continue;
        tCtx.beginPath();
        tCtx.strokeStyle = '#000000'; // Force black text for export
        tCtx.lineWidth = stroke.width;
        tCtx.moveTo(stroke.points[0].x - minX + padding, stroke.points[0].y - minY + padding);
        for (let i = 1; i < stroke.points.length; i++) {
          tCtx.lineTo(stroke.points[i].x - minX + padding, stroke.points[i].y - minY + padding);
        }
        tCtx.stroke();
      }

      const dataUrl = tempCanvas.toDataURL('image/png');
      console.log("Captured Image URL (Base64 length):", dataUrl.length);
      
      const outputTerm = document.querySelector('.bg-on-surface .industrial-border');
      if (outputTerm) {
        outputTerm.innerHTML += `<br/>&gt; Đang gửi ảnh lên server...<br/>`;
        outputTerm.scrollTop = outputTerm.scrollHeight;
      }

      fetch('/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: dataUrl })
      })
      .then(response => response.json())
      .then(data => {
        console.log("Server response:", data);
        if (outputTerm) {
          if (data.error) {
            outputTerm.innerHTML += `&gt; <span style="color:#ff6b1a">Lỗi: ${data.error}</span><br/>`;
          } else {
            outputTerm.innerHTML += `&gt; Server: ${data.message}<br/>`;
            outputTerm.innerHTML += `&gt; Result: ${data.result}<br/>`;
          }
          outputTerm.scrollTop = outputTerm.scrollHeight;
        }

        const pythonOutput = document.getElementById('python-output');
        if (pythonOutput) {
          if (data.error) {
             pythonOutput.innerHTML = `<span style="color:#ff6b1a">${data.error}</span>`;
          } else if (data.stdout) {
             pythonOutput.textContent = data.stdout;
          } else if (data.stderr) {
             pythonOutput.textContent = data.stderr;
          } else if (data.compile_output) {
             pythonOutput.textContent = data.compile_output;
          } else {
             pythonOutput.textContent = "No output";
          }
        }
      })
      .catch(err => {
        console.error("Error sending image to server:", err);
        if (outputTerm) {
          outputTerm.innerHTML += `&gt; <span style="color:#ff6b1a">Lỗi kết nối server.</span><br/>`;
          outputTerm.scrollTop = outputTerm.scrollHeight;
        }
      });
    });
  }

  const navSettings = document.getElementById('nav-settings');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettings = document.getElementById('close-settings');
  const darkModeToggle = document.getElementById('dark-mode-toggle');

  if (navSettings && settingsModal) {
    navSettings.addEventListener('click', (e) => {
      e.preventDefault();
      settingsModal.classList.remove('hidden');
    });
  }

  if (closeSettings && settingsModal) {
    closeSettings.addEventListener('click', () => {
      settingsModal.classList.add('hidden');
    });
  }

  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      instances.forEach(inst => inst.redraw());
    });
  }

  updateToolUI();
});
