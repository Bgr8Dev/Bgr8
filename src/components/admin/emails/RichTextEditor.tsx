import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaSuperscript,
  FaSubscript,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaIndent,
  FaOutdent,
  FaLink,
  FaImage,
  FaTable,
  FaCode,
  FaUndo,
  FaRedo,
  FaFont,
  FaTextHeight,
  FaTextWidth,
  FaHighlighter,
  FaEraser,
  FaCut,
  FaCopy,
  FaPaste,
  FaExpand,
  FaCompress,
  FaPalette,
  FaMagic,
  FaHeading,
  FaParagraph,
  FaList,
  FaCheckSquare,
  FaSquare,
  FaMinus,
  FaPlus,
  FaTimes,
  FaCheck,
  FaEye,
  FaEyeSlash,
  FaSave,
  FaUpload,
  FaDownload,
  FaSearch,
  FaReplace,
  FaSpellCheck,
  FaLanguage,
  FaFileImage,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileAlt,
  FaFileCode,
  FaFileArchive,
  FaFileAudio,
  FaFileVideo,
  FaCloudUploadAlt,
  FaCloudDownloadAlt,
  FaSync,
  FaCog,
  FaQuestionCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaLightbulb,
  FaRocket,
  FaStar,
  FaHeart,
  FaThumbsUp,
  FaThumbsDown,
  FaSmile,
  FaFrown,
  FaMeh,
  FaGrin,
  FaAngry,
  FaSurprise,
  FaSadTear,
  FaLaugh,
  FaKiss,
  FaWink,
  FaGrinBeam,
  FaGrinHearts,
  FaGrinSquint,
  FaGrinStars,
  FaGrinTears,
  FaGrinTongue,
  FaGrinWink,
  FaKissBeam,
  FaKissWinkHeart,
  FaLaughBeam,
  FaLaughSquint,
  FaLaughWink,
  FaAngry as FaAngryIcon,
  FaDizzy,
  FaFlushed,
  FaFrownOpen,
  FaGrimace,
  FaGrinAlt,
  FaGrinBeamSweat,
  FaHushed,
  FaMehBlank,
  FaMehRollingEyes,
  FaSadCry,
  FaSmileBeam,
  FaSmileWink,
  FaTired,
  FaWink as FaWinkIcon
} from 'react-icons/fa';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showToolbar?: boolean;
  showWordCount?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
  allowImages?: boolean;
  allowLinks?: boolean;
  allowTables?: boolean;
  allowCode?: boolean;
  allowEmojis?: boolean;
  allowFileUpload?: boolean;
  onSave?: () => void;
  onPreview?: () => void;
  onExport?: () => void;
  onImport?: () => void;
}

interface ToolbarButton {
  id: string;
  icon: React.ComponentType<any>;
  title: string;
  action: () => void;
  active?: boolean;
  disabled?: boolean;
  group?: string;
  shortcut?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing your email...",
  className = "",
  disabled = false,
  showToolbar = true,
  showWordCount = true,
  showCharCount = true,
  maxLength = 10000,
  allowImages = true,
  allowLinks = true,
  allowTables = true,
  allowCode = true,
  allowEmojis = true,
  allowFileUpload = true,
  onSave,
  onPreview,
  onExport,
  onImport
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [currentFormat, setCurrentFormat] = useState<any>({});
  const [history, setHistory] = useState<string[]>([content]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpellCheck, setShowSpellCheck] = useState(false);
  const [spellCheckResults, setSpellCheckResults] = useState<any[]>([]);

  // Emoji data
  const emojis = [
    { name: 'Smile', emoji: '😊', icon: FaSmile },
    { name: 'Laugh', emoji: '😂', icon: FaLaugh },
    { name: 'Love', emoji: '❤️', icon: FaHeart },
    { name: 'Thumbs Up', emoji: '👍', icon: FaThumbsUp },
    { name: 'Thumbs Down', emoji: '👎', icon: FaThumbsDown },
    { name: 'Star', emoji: '⭐', icon: FaStar },
    { name: 'Rocket', emoji: '🚀', icon: FaRocket },
    { name: 'Lightbulb', emoji: '💡', icon: FaLightbulb },
    { name: 'Check', emoji: '✅', icon: FaCheck },
    { name: 'Cross', emoji: '❌', icon: FaTimes },
    { name: 'Warning', emoji: '⚠️', icon: FaExclamationTriangle },
    { name: 'Info', emoji: 'ℹ️', icon: FaInfoCircle },
    { name: 'Question', emoji: '❓', icon: FaQuestionCircle },
    { name: 'Gear', emoji: '⚙️', icon: FaCog },
    { name: 'Sync', emoji: '🔄', icon: FaSync },
    { name: 'Upload', emoji: '📤', icon: FaCloudUploadAlt },
    { name: 'Download', emoji: '📥', icon: FaCloudDownloadAlt },
    { name: 'Save', emoji: '💾', icon: FaSave },
    { name: 'Eye', emoji: '👁️', icon: FaEye },
    { name: 'Eye Slash', emoji: '🙈', icon: FaEyeSlash },
    { name: 'Search', emoji: '🔍', icon: FaSearch },
    { name: 'Replace', emoji: '🔄', icon: FaReplace },
    { name: 'Spell Check', emoji: '📝', icon: FaSpellCheck },
    { name: 'Language', emoji: '🌐', icon: FaLanguage },
    { name: 'Image', emoji: '🖼️', icon: FaFileImage },
    { name: 'PDF', emoji: '📄', icon: FaFilePdf },
    { name: 'Word', emoji: '📝', icon: FaFileWord },
    { name: 'Excel', emoji: '📊', icon: FaFileExcel },
    { name: 'PowerPoint', emoji: '📽️', icon: FaFilePowerpoint },
    { name: 'Text', emoji: '📄', icon: FaFileAlt },
    { name: 'Code', emoji: '💻', icon: FaFileCode },
    { name: 'Archive', emoji: '📦', icon: FaFileArchive },
    { name: 'Audio', emoji: '🎵', icon: FaFileAudio },
    { name: 'Video', emoji: '🎬', icon: FaFileVideo }
  ];

  // Color palette
  const colors = [
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
    '#FF0000', '#FF6600', '#FFCC00', '#00FF00', '#00CCFF', '#0066FF',
    '#6600FF', '#FF00CC', '#FF3366', '#FF9933', '#FFFF00', '#66FF00',
    '#00FFFF', '#3366FF', '#9933FF', '#FF33CC', '#FF6666', '#FF9966',
    '#FFFF66', '#66FF66', '#66FFFF', '#6666FF', '#9966FF', '#FF66CC'
  ];

  // Font families
  const fontFamilies = [
    'Arial, sans-serif',
    'Helvetica, sans-serif',
    'Times New Roman, serif',
    'Georgia, serif',
    'Courier New, monospace',
    'Verdana, sans-serif',
    'Trebuchet MS, sans-serif',
    'Arial Black, sans-serif',
    'Comic Sans MS, cursive',
    'Impact, sans-serif'
  ];

  // Font sizes
  const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

  // Update history when content changes
  useEffect(() => {
    if (content !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(content);
      if (newHistory.length > 50) {
        newHistory.shift();
      } else {
        setHistoryIndex(historyIndex + 1);
      }
      setHistory(newHistory);
    }
  }, [content, history, historyIndex]);

  // Focus editor
  const focusEditor = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  // Execute command
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    focusEditor();
    updateFormat();
  }, [focusEditor]);

  // Update current format
  const updateFormat = useCallback(() => {
    if (editorRef.current) {
      const format = {
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikeThrough'),
        superscript: document.queryCommandState('superscript'),
        subscript: document.queryCommandState('subscript'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyFull: document.queryCommandState('justifyFull'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        indent: document.queryCommandState('indent'),
        outdent: document.queryCommandState('outdent')
      };
      setCurrentFormat(format);
    }
  }, []);

  // Handle content change
  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      if (newContent !== content) {
        onChange(newContent);
      }
    }
  }, [content, onChange]);

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  // Handle key down
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
        case 's':
          e.preventDefault();
          onSave?.();
          break;
        case 'f':
          e.preventDefault();
          setShowSearchReplace(true);
          break;
        case 'h':
          e.preventDefault();
          setShowSearchReplace(true);
          break;
        case 'k':
          e.preventDefault();
          setShowLinkDialog(true);
          break;
        case 'Enter':
          e.preventDefault();
          if (e.shiftKey) {
            execCommand('insertHTML', '<br>');
          } else {
            execCommand('insertHTML', '<p></p>');
          }
          break;
      }
    }
  }, [execCommand, onSave]);

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  }, [historyIndex, history, onChange]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  }, [historyIndex, history, onChange]);

  // Insert emoji
  const insertEmoji = useCallback((emoji: string) => {
    execCommand('insertText', emoji);
    setShowEmojiPicker(false);
  }, [execCommand]);

  // Insert link
  const insertLink = useCallback((url: string, text: string) => {
    if (url && text) {
      execCommand('createLink', url);
    }
    setShowLinkDialog(false);
  }, [execCommand]);

  // Insert image
  const insertImage = useCallback((src: string, alt: string, width?: string, height?: string) => {
    if (src) {
      const imgTag = `<img src="${src}" alt="${alt}" ${width ? `width="${width}"` : ''} ${height ? `height="${height}"` : ''} style="max-width: 100%; height: auto;">`;
      execCommand('insertHTML', imgTag);
    }
    setShowImageDialog(false);
  }, [execCommand]);

  // Insert table
  const insertTable = useCallback((rows: number, cols: number) => {
    let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%;">';
    for (let i = 0; i < rows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < cols; j++) {
        tableHTML += '<td style="padding: 8px; border: 1px solid #ccc;">&nbsp;</td>';
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</table>';
    execCommand('insertHTML', tableHTML);
    setShowTableDialog(false);
  }, [execCommand]);

  // Insert code
  const insertCode = useCallback((code: string, language: string) => {
    const codeTag = `<pre><code class="language-${language}">${code}</code></pre>`;
    execCommand('insertHTML', codeTag);
    setShowCodeDialog(false);
  }, [execCommand]);

  // Search and replace
  const searchAndReplace = useCallback(() => {
    if (searchTerm) {
      const newContent = content.replace(new RegExp(searchTerm, 'g'), replaceTerm);
      onChange(newContent);
    }
    setShowSearchReplace(false);
  }, [searchTerm, replaceTerm, content, onChange]);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (file.type.startsWith('image/')) {
          insertImage(result, file.name);
        } else {
          // Handle other file types
          const fileTag = `<a href="${result}" download="${file.name}">${file.name}</a>`;
          execCommand('insertHTML', fileTag);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [insertImage, execCommand]);

  // Word and character count
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
  const charCount = content.replace(/<[^>]*>/g, '').length;

  // Toolbar buttons
  const toolbarButtons: ToolbarButton[] = [
    // History
    { id: 'undo', icon: FaUndo, title: 'Undo (Ctrl+Z)', action: undo, disabled: historyIndex === 0, group: 'history' },
    { id: 'redo', icon: FaRedo, title: 'Redo (Ctrl+Y)', action: redo, disabled: historyIndex === history.length - 1, group: 'history' },
    
    // Text formatting
    { id: 'bold', icon: FaBold, title: 'Bold (Ctrl+B)', action: () => execCommand('bold'), active: currentFormat.bold, group: 'format' },
    { id: 'italic', icon: FaItalic, title: 'Italic (Ctrl+I)', action: () => execCommand('italic'), active: currentFormat.italic, group: 'format' },
    { id: 'underline', icon: FaUnderline, title: 'Underline (Ctrl+U)', action: () => execCommand('underline'), active: currentFormat.underline, group: 'format' },
    { id: 'strikethrough', icon: FaStrikethrough, title: 'Strikethrough', action: () => execCommand('strikeThrough'), active: currentFormat.strikethrough, group: 'format' },
    { id: 'superscript', icon: FaSuperscript, title: 'Superscript', action: () => execCommand('superscript'), active: currentFormat.superscript, group: 'format' },
    { id: 'subscript', icon: FaSubscript, title: 'Subscript', action: () => execCommand('subscript'), active: currentFormat.subscript, group: 'format' },
    
    // Alignment
    { id: 'align-left', icon: FaAlignLeft, title: 'Align Left', action: () => execCommand('justifyLeft'), active: currentFormat.justifyLeft, group: 'align' },
    { id: 'align-center', icon: FaAlignCenter, title: 'Align Center', action: () => execCommand('justifyCenter'), active: currentFormat.justifyCenter, group: 'align' },
    { id: 'align-right', icon: FaAlignRight, title: 'Align Right', action: () => execCommand('justifyRight'), active: currentFormat.justifyRight, group: 'align' },
    { id: 'align-justify', icon: FaAlignJustify, title: 'Justify', action: () => execCommand('justifyFull'), active: currentFormat.justifyFull, group: 'align' },
    
    // Lists
    { id: 'bullet-list', icon: FaListUl, title: 'Bullet List', action: () => execCommand('insertUnorderedList'), active: currentFormat.insertUnorderedList, group: 'list' },
    { id: 'numbered-list', icon: FaListOl, title: 'Numbered List', action: () => execCommand('insertOrderedList'), active: currentFormat.insertOrderedList, group: 'list' },
    { id: 'indent', icon: FaIndent, title: 'Indent', action: () => execCommand('indent'), active: currentFormat.indent, group: 'list' },
    { id: 'outdent', icon: FaOutdent, title: 'Outdent', action: () => execCommand('outdent'), active: currentFormat.outdent, group: 'list' },
    
    // Insert
    { id: 'link', icon: FaLink, title: 'Insert Link (Ctrl+K)', action: () => setShowLinkDialog(true), disabled: !allowLinks, group: 'insert' },
    { id: 'image', icon: FaImage, title: 'Insert Image', action: () => setShowImageDialog(true), disabled: !allowImages, group: 'insert' },
    { id: 'table', icon: FaTable, title: 'Insert Table', action: () => setShowTableDialog(true), disabled: !allowTables, group: 'insert' },
    { id: 'code', icon: FaCode, title: 'Insert Code', action: () => setShowCodeDialog(true), disabled: !allowCode, group: 'insert' },
    { id: 'emoji', icon: FaSmile, title: 'Insert Emoji', action: () => setShowEmojiPicker(!showEmojiPicker), disabled: !allowEmojis, group: 'insert' },
    
    // Tools
    { id: 'search', icon: FaSearch, title: 'Search (Ctrl+F)', action: () => setShowSearchReplace(true), group: 'tools' },
    { id: 'spell-check', icon: FaSpellCheck, title: 'Spell Check', action: () => setShowSpellCheck(!showSpellCheck), group: 'tools' },
    { id: 'fullscreen', icon: isFullscreen ? FaCompress : FaExpand, title: 'Toggle Fullscreen', action: () => setIsFullscreen(!isFullscreen), group: 'tools' },
    
    // Actions
    { id: 'save', icon: FaSave, title: 'Save (Ctrl+S)', action: () => onSave?.(), group: 'actions' },
    { id: 'preview', icon: FaEye, title: 'Preview', action: () => onPreview?.(), group: 'actions' },
    { id: 'export', icon: FaDownload, title: 'Export', action: () => onExport?.(), group: 'actions' },
    { id: 'import', icon: FaUpload, title: 'Import', action: () => onImport?.(), group: 'actions' }
  ];

  // Group buttons by category
  const groupedButtons = toolbarButtons.reduce((groups, button) => {
    const group = button.group || 'other';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(button);
    return groups;
  }, {} as Record<string, ToolbarButton[]>);

  return (
    <div className={`rich-text-editor ${className} ${isFullscreen ? 'fullscreen' : ''}`}>
      {showToolbar && (
        <div className="rich-text-toolbar">
          {Object.entries(groupedButtons).map(([groupName, buttons]) => (
            <div key={groupName} className="toolbar-group">
              {buttons.map(button => (
                <button
                  key={button.id}
                  className={`toolbar-btn ${button.active ? 'active' : ''} ${button.disabled ? 'disabled' : ''}`}
                  onClick={button.action}
                  disabled={button.disabled}
                  title={button.title}
                >
                  <button.icon />
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="rich-text-content">
        <div
          ref={editorRef}
          className={`rich-text-editor-content ${isFocused ? 'focused' : ''}`}
          contentEditable={!disabled}
          dangerouslySetInnerHTML={{ __html: content }}
          onInput={handleContentChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onMouseUp={updateFormat}
          onKeyUp={updateFormat}
          style={{ minHeight: '400px' }}
          data-placeholder={placeholder}
        />
      </div>

      {(showWordCount || showCharCount) && (
        <div className="rich-text-stats">
          {showWordCount && <span>Words: {wordCount}</span>}
          {showCharCount && <span>Characters: {charCount}</span>}
          {maxLength && <span>Max: {maxLength}</span>}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="emoji-picker">
          <div className="emoji-picker-header">
            <h4>Insert Emoji</h4>
            <button onClick={() => setShowEmojiPicker(false)} title="Close emoji picker">
              <FaTimes />
            </button>
          </div>
          <div className="emoji-grid">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                className="emoji-btn"
                onClick={() => insertEmoji(emoji.emoji)}
                title={emoji.name}
              >
                {emoji.emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="link-dialog">
          <div className="dialog-header">
            <h4>Insert Link</h4>
            <button onClick={() => setShowLinkDialog(false)} title="Close link dialog">
              <FaTimes />
            </button>
          </div>
          <div className="dialog-content">
            <input
              type="text"
              placeholder="Link URL"
              className="link-url-input"
            />
            <input
              type="text"
              placeholder="Link Text"
              className="link-text-input"
            />
            <div className="dialog-actions">
              <button onClick={() => setShowLinkDialog(false)}>Cancel</button>
              <button onClick={() => insertLink('', '')}>Insert</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="image-dialog">
          <div className="dialog-header">
            <h4>Insert Image</h4>
            <button onClick={() => setShowImageDialog(false)} title="Close image dialog">
              <FaTimes />
            </button>
          </div>
          <div className="dialog-content">
            <input
              type="url"
              placeholder="Image URL"
              className="image-url-input"
            />
            <input
              type="text"
              placeholder="Alt Text"
              className="image-alt-input"
            />
            <input
              type="number"
              placeholder="Width (optional)"
              className="image-width-input"
            />
            <input
              type="number"
              placeholder="Height (optional)"
              className="image-height-input"
            />
            <div className="file-upload-area">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button onClick={() => fileInputRef.current?.click()}>
                <FaUpload /> Upload Image
              </button>
            </div>
            <div className="dialog-actions">
              <button onClick={() => setShowImageDialog(false)}>Cancel</button>
              <button onClick={() => insertImage('', '', '', '')}>Insert</button>
            </div>
          </div>
        </div>
      )}

      {/* Table Dialog */}
      {showTableDialog && (
        <div className="table-dialog">
          <div className="dialog-header">
            <h4>Insert Table</h4>
            <button onClick={() => setShowTableDialog(false)} title="Close table dialog">
              <FaTimes />
            </button>
          </div>
          <div className="dialog-content">
            <div className="table-size-selector">
              <label>Rows:</label>
              <input type="number" min="1" max="20" defaultValue="3" />
              <label>Columns:</label>
              <input type="number" min="1" max="20" defaultValue="3" />
            </div>
            <div className="dialog-actions">
              <button onClick={() => setShowTableDialog(false)}>Cancel</button>
              <button onClick={() => insertTable(3, 3)}>Insert</button>
            </div>
          </div>
        </div>
      )}

      {/* Code Dialog */}
      {showCodeDialog && (
        <div className="code-dialog">
          <div className="dialog-header">
            <h4>Insert Code</h4>
            <button onClick={() => setShowCodeDialog(false)} title="Close code dialog">
              <FaTimes />
            </button>
          </div>
          <div className="dialog-content">
            <select className="code-language-select">
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="csharp">C#</option>
              <option value="php">PHP</option>
              <option value="sql">SQL</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="markdown">Markdown</option>
            </select>
            <textarea
              placeholder="Enter your code here..."
              className="code-textarea"
              rows={10}
            />
            <div className="dialog-actions">
              <button onClick={() => setShowCodeDialog(false)}>Cancel</button>
              <button onClick={() => insertCode('', 'html')}>Insert</button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Replace Dialog */}
      {showSearchReplace && (
        <div className="search-replace-dialog">
          <div className="dialog-header">
            <h4>Search and Replace</h4>
            <button onClick={() => setShowSearchReplace(false)} title="Close search and replace dialog">
              <FaTimes />
            </button>
          </div>
          <div className="dialog-content">
            <input
              type="text"
              placeholder="Search for..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              className="replace-input"
            />
            <div className="dialog-actions">
              <button onClick={() => setShowSearchReplace(false)}>Cancel</button>
              <button onClick={searchAndReplace}>Replace All</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for uploads */}
      {allowFileUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt,.rtf"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
};

export default RichTextEditor;
