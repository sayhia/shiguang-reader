    const BUILTIN_BOOKS = [];

    const LOCAL_COVERS = [
      { from: '#353a54', to: '#6d6f8e', ink: '#f7f0df', accent: '#d9b980', glyph: '书' },
      { from: '#4b3a32', to: '#8a6b55', ink: '#fbf2e2', accent: '#e3bd8c', glyph: '读' },
      { from: '#283e3b', to: '#5f7c70', ink: '#f5efdf', accent: '#d1bb8c', glyph: '页' },
      { from: '#3e2e3b', to: '#775d72', ink: '#f8eee7', accent: '#e0b4b0', glyph: '墨' },
      { from: '#263849', to: '#58758c', ink: '#f4f0e6', accent: '#c9d0b8', glyph: '卷' },
    ];

    const READER_THEMES = [
      { id: 'paper', bg: '#f3ede2', panel: '#faf5eb', ink: '#322920', muted: '#6e5f4d', line: 'rgba(94,73,48,0.16)', accent: '#9c6a36', wash: 'rgba(156,106,54,0.14)' },
      { id: 'candle', bg: '#f4e6ce', panel: '#faeedc', ink: '#2e1d0f', muted: '#725439', line: 'rgba(90,56,22,0.14)', accent: '#ad6b2a', wash: 'rgba(173,107,42,0.14)' },
      { id: 'snow', bg: '#f8f7f4', panel: '#ffffff', ink: '#292825', muted: '#6c6860', line: 'rgba(62,60,54,0.11)', accent: '#467268', wash: 'rgba(70,114,104,0.1)' },
      { id: 'mint', bg: '#e6eee4', panel: '#f1f6ef', ink: '#273428', muted: '#586856', line: 'rgba(50,72,52,0.13)', accent: '#4a744b', wash: 'rgba(74,116,75,0.12)' },
      { id: 'forest', bg: '#121c18', panel: '#1a2721', ink: '#c3d6cc', muted: '#92b2a1', line: 'rgba(180,210,195,0.12)', accent: '#65a982', wash: 'rgba(101,169,130,0.14)' },
      { id: 'night', bg: '#151a1d', panel: '#1d2529', ink: '#e2ded5', muted: '#9ea7a4', line: 'rgba(206,198,181,0.14)', accent: '#cbb07a', wash: 'rgba(203,176,122,0.12)' },
      { id: 'oled', bg: '#000000', panel: '#0d0d0e', ink: '#dcd8cd', muted: '#94948d', line: 'rgba(255,255,255,0.12)', accent: '#c49d64', wash: 'rgba(196,157,100,0.14)' },
      { id: 'eink', bg: '#ffffff', panel: '#ffffff', ink: '#000000', muted: '#333333', line: 'rgba(0,0,0,0.22)', accent: '#000000', wash: 'rgba(0,0,0,0.08)' },
    ];

    const HIGHLIGHT_COLORS = [
      { id: 'amber', value: '#d8a23f' },
      { id: 'sage', value: '#6f9b79' },
      { id: 'sky', value: '#5b8fb9' },
      { id: 'rose', value: '#c6757b' },
    ];

    function bytesToBase64(bytes) {
      if (!bytes || !bytes.length) return '';
      let binary = '';
      const chunk = 0x8000;
      for (let index = 0; index < bytes.length; index += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunk));
      }
      return btoa(binary);
    }

    async function downscaleCoverDataUrl(dataUrl, maxW, maxH) {
      if (typeof dataUrl !== 'string' || dataUrl.indexOf('data:image/') !== 0) return dataUrl;
      const targetW = maxW || 360;
      const targetH = maxH || 504;
      if (typeof Image === 'undefined') return dataUrl;
      return new Promise(function (resolve) {
        const img = new Image();
        img.onload = function () {
          try {
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;
            if (width <= 0 || height <= 0) {
              resolve(dataUrl);
              return;
            }
            if (width <= targetW && height <= targetH && dataUrl.length <= 90000) {
              resolve(dataUrl);
              return;
            }
            const ratio = Math.min(targetW / width, targetH / height, 1);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, width, height);
            }
            const thumbUrl = canvas.toDataURL('image/jpeg', 0.88);
            canvas.width = 0;
            canvas.height = 0;
            img.src = '';
            resolve(thumbUrl.length < dataUrl.length ? thumbUrl : dataUrl);
          } catch (e) {
            img.src = '';
            resolve(dataUrl);
          }
        };
        img.onerror = function () { img.src = ''; resolve(dataUrl); };
        img.src = dataUrl;
      });
    }
