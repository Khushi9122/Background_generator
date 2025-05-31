// App.js
import React, { useState, useEffect, useRef } from 'react';
import { openDB } from 'idb';
import './App.css';

function App() {
  const [type, setType] = useState('gradient');
  const [color1, setColor1] = useState('#ff7e5f');
  const [color2, setColor2] = useState('#feb47b');
  const [angle, setAngle] = useState(90);
  const [animate, setAnimate] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageSize, setImageSize] = useState('cover');
  const [imagePosition, setImagePosition] = useState('center');
  const [imageRepeat, setImageRepeat] = useState('no-repeat');

  const [background, setBackground] = useState('');
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const dropRef = useRef(null);

  useEffect(() => {
    updateBackground();
  }, [type, color1, color2, angle, animate, imageUrl, imageSize, imagePosition, imageRepeat]);

  useEffect(() => {
    const loadPresets = async () => {
      const db = await openDB('bgDB', 1, {
        upgrade(db) {
          db.createObjectStore('presets', { keyPath: 'name' });
        }
      });
      const all = await db.getAll('presets');
      setPresets(all);
    };
    loadPresets();
  }, []);

  useEffect(() => {
    if (dropRef.current) {
      dropRef.current.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      dropRef.current.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          const url = URL.createObjectURL(file);
          setType('image');
          setImageUrl(url);
          saveToHistory();
        }
      });
    }
  }, []);

  const updateBackground = () => {
    let bg = '';
    if (type === 'solid') {
      bg = color1;
    } else if (type === 'gradient') {
      bg = `linear-gradient(${angle}deg, ${color1}, ${color2})`;
    } else if (type === 'image') {
      bg = `url(${imageUrl}) ${imagePosition} / ${imageSize} ${imageRepeat}`;
    }
    setBackground(bg);
  };

  const saveToHistory = () => {
    setHistory((prev) => [
      ...prev,
      { type, color1, color2, angle, animate, imageUrl, imageSize, imagePosition, imageRepeat }
    ]);
    setFuture([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture((f) => [
      ...f,
      {
        type,
        color1,
        color2,
        angle,
        animate,
        imageUrl,
        imageSize,
        imagePosition,
        imageRepeat
      }
    ]);
    setHistory((h) => h.slice(0, h.length - 1));
    applyPreset(prev);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[future.length - 1];
    setFuture((f) => f.slice(0, f.length - 1));
    setHistory((h) => [
      ...h,
      { type, color1, color2, angle, animate, imageUrl, imageSize, imagePosition, imageRepeat }
    ]);
    applyPreset(next);
  };

  const savePreset = async () => {
    if (!presetName) return alert('Enter a name!');
    const db = await openDB('bgDB', 1);
    const newPreset = {
      name: presetName,
      type,
      color1,
      color2,
      angle,
      animate,
      imageUrl,
      imageSize,
      imagePosition,
      imageRepeat
    };
    await db.put('presets', newPreset);
    const all = await db.getAll('presets');
    setPresets(all);
    setPresetName('');
  };

  const deletePreset = async (name) => {
    const db = await openDB('bgDB', 1);
    await db.delete('presets', name);
    const all = await db.getAll('presets');
    setPresets(all);
  };

  const applyPreset = (p) => {
    setType(p.type);
    setColor1(p.color1);
    setColor2(p.color2);
    setAngle(p.angle);
    setAnimate(p.animate || false);
    setImageUrl(p.imageUrl || '');
    setImageSize(p.imageSize || 'cover');
    setImagePosition(p.imagePosition || 'center');
    setImageRepeat(p.imageRepeat || 'no-repeat');
    setPresetName(p.name);
  };

  return (
    <div className="app-container">
      <div className="controls" ref={dropRef}>
        <h2>Background Generator</h2>

        <label>Type:
          <select value={type} onChange={e => { setType(e.target.value); saveToHistory(); }}>
            <option value="gradient">Gradient</option>
            <option value="solid">Solid</option>
            <option value="image">Image</option>
          </select>
        </label>

        {(type === 'gradient' || type === 'solid') && (
          <label>Color 1:
            <input type="color" value={color1} onChange={e => { setColor1(e.target.value); saveToHistory(); }} />
          </label>
        )}

        {type === 'gradient' && (
          <>
            <label>Color 2:
              <input type="color" value={color2} onChange={e => { setColor2(e.target.value); saveToHistory(); }} />
            </label>
            <label>Angle:
              <input type="range" min="0" max="360" value={angle} onChange={e => { setAngle(e.target.value); saveToHistory(); }} />
              {angle}°
            </label>
            <label>
              Animate:
              <input type="checkbox" checked={animate} onChange={e => { setAnimate(e.target.checked); saveToHistory(); }} />
            </label>
          </>
        )}

        {type === 'image' && (
          <>
            <label>Image URL:
              <input type="text" value={imageUrl} onChange={e => { setImageUrl(e.target.value); saveToHistory(); }} />
            </label>
            <label>Size:
              <select value={imageSize} onChange={e => { setImageSize(e.target.value); saveToHistory(); }}>
                <option value="cover">cover</option>
                <option value="contain">contain</option>
                <option value="auto">auto</option>
              </select>
            </label>
            <label>Position:
              <select value={imagePosition} onChange={e => { setImagePosition(e.target.value); saveToHistory(); }}>
                <option value="center">center</option>
                <option value="top">top</option>
                <option value="bottom">bottom</option>
                <option value="left">left</option>
                <option value="right">right</option>
              </select>
            </label>
            <label>Repeat:
              <select value={imageRepeat} onChange={e => { setImageRepeat(e.target.value); saveToHistory(); }}>
                <option value="no-repeat">no-repeat</option>
                <option value="repeat">repeat</option>
                <option value="repeat-x">repeat-x</option>
                <option value="repeat-y">repeat-y</option>
              </select>
            </label>
          </>
        )}

        <label>Preset Name:
          <input type="text" value={presetName} onChange={e => setPresetName(e.target.value)} />
        </label>
        <button onClick={savePreset}>💾 Save Preset</button>

        <div style={{ marginTop: '10px' }}>
          <button onClick={undo} disabled={history.length === 0}>↩ Undo</button>
          <button onClick={redo} disabled={future.length === 0}>↪ Redo</button>
        </div>

        <h3>Presets</h3>
        <div className="preset-gallery">
          {presets.map((p, i) => {
            const preview = p.type === 'gradient'
              ? `linear-gradient(${p.angle}deg, ${p.color1}, ${p.color2})`
              : p.type === 'solid'
                ? p.color1
                : `url(${p.imageUrl}) center/cover no-repeat`;

            return (
              <div
                key={i}
                className="preset-thumb"
                style={{ background: preview }}
                onClick={() => applyPreset(p)}
              >
                <span>{p.name}</span>
                <button onClick={(e) => { e.stopPropagation(); deletePreset(p.name); }}>🗑</button>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`preview-box ${animate ? 'animate-gradient' : ''}`} style={{ background }}>
        <button onClick={() => setShowPreviewModal(true)}>🔍 Expand Preview</button>
      </div>

      {showPreviewModal && (
        <div className="modal" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content" style={{ background }}>
            <span className="close">&times;</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
