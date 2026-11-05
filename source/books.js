    const BUILTIN_BOOKS = [];

    const LOCAL_COVERS = [
      { from: '#353a54', to: '#6d6f8e', ink: '#f7f0df', accent: '#d9b980', glyph: '书' },
      { from: '#4b3a32', to: '#8a6b55', ink: '#fbf2e2', accent: '#e3bd8c', glyph: '读' },
      { from: '#283e3b', to: '#5f7c70', ink: '#f5efdf', accent: '#d1bb8c', glyph: '页' },
      { from: '#3e2e3b', to: '#775d72', ink: '#f8eee7', accent: '#e0b4b0', glyph: '墨' },
      { from: '#263849', to: '#58758c', ink: '#f4f0e6', accent: '#c9d0b8', glyph: '卷' },
    ];

    const READER_THEMES = [
      { id: 'paper', bg: '#f2eadb', panel: '#faf4e8', ink: '#3a3024', muted: '#8a7860', line: 'rgba(94,73,48,0.15)', accent: '#a4743f', wash: 'rgba(164,116,63,0.12)' },
      { id: 'snow', bg: '#f8f7f3', panel: '#fdfcf9', ink: '#2d2c29', muted: '#87827a', line: 'rgba(62,60,54,0.12)', accent: '#57776f', wash: 'rgba(87,119,111,0.1)' },
      { id: 'mint', bg: '#e6eee3', panel: '#f1f6ef', ink: '#2e3a2f', muted: '#71806e', line: 'rgba(55,78,58,0.14)', accent: '#5f7d5f', wash: 'rgba(95,125,95,0.12)' },
      { id: 'night', bg: '#14191c', panel: '#1d2428', ink: '#c9c3b6', muted: '#7f8885', line: 'rgba(206,198,181,0.13)', accent: '#c8a46c', wash: 'rgba(200,164,108,0.1)' },
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
