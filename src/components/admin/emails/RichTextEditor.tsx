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
  FaHeading,
  FaParagraph,
  FaMinus,
  FaTimes,
  FaCheck,
  FaEye,
  FaEyeSlash,
  FaSave,
  FaUpload,
  FaDownload,
  FaSearch,
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
  FaLaugh,
  FaCalendarAlt
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
  icon: React.ComponentType<{ className?: string }>;
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
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [currentFormat, setCurrentFormat] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<string[]>([content]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpellCheck, setShowSpellCheck] = useState(false);
  const [spellCheckResults, setSpellCheckResults] = useState<Array<{word: string; index: number; suggestions: string[]}>>([]);
  
  // Dialog states
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageWidth, setImageWidth] = useState('');
  const [imageHeight, setImageHeight] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [codeContent, setCodeContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('html');
  const [selectedFontFamily] = useState('Arial, sans-serif');
  const [selectedFontSize] = useState('16');
  const [selectedTextColor] = useState('#ffffff');
  const [selectedHighlightColor] = useState('#ffff00');

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
    { name: 'Replace', emoji: '🔄', icon: FaSync },
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

  // Save cursor position
  const saveCursorPosition = useCallback(() => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editorRef.current);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        const caretOffset = preCaretRange.toString().length;
        return caretOffset;
      }
    }
    return 0;
  }, []);

  // Restore cursor position
  const restoreCursorPosition = useCallback((offset: number) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        const walker = document.createTreeWalker(
          editorRef.current,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        let currentOffset = 0;
        let targetNode = null;
        let targetOffset = 0;
        
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const nodeLength = node.textContent?.length || 0;
          if (currentOffset + nodeLength >= offset) {
            targetNode = node;
            targetOffset = offset - currentOffset;
            break;
          }
          currentOffset += nodeLength;
        }
        
        if (targetNode) {
          range.setStart(targetNode, targetOffset);
          range.setEnd(targetNode, targetOffset);
        } else {
          // If we can't find the exact position, put cursor at the end
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
        }
        
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, []);

  // Handle content change with cursor preservation
  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      if (newContent !== content) {
        const cursorPosition = saveCursorPosition();
        onChange(newContent);
        // Restore cursor position after state update
        setTimeout(() => restoreCursorPosition(cursorPosition), 0);
      }
    }
  }, [content, onChange, saveCursorPosition, restoreCursorPosition]);

  // Sync content when it changes externally (e.g., from templates)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      const cursorPosition = saveCursorPosition();
      editorRef.current.innerHTML = content;
      // Restore cursor position after content update
      setTimeout(() => restoreCursorPosition(cursorPosition), 0);
    }
  }, [content, saveCursorPosition, restoreCursorPosition]);

  // Execute command
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    focusEditor();
    updateFormat();
    handleContentChange();
  }, [focusEditor, updateFormat, handleContentChange]);

  // Advanced formatting functions
  const applyFontFamily = useCallback((family: string) => {
    execCommand('fontName', family);
  }, [execCommand]);

  const applyFontSize = useCallback((size: string) => {
    execCommand('fontSize', size);
  }, [execCommand]);

  const applyTextColor = useCallback((color: string) => {
    execCommand('foreColor', color);
  }, [execCommand]);

  const applyHighlightColor = useCallback((color: string) => {
    execCommand('backColor', color);
  }, [execCommand]);

  const insertHorizontalRule = useCallback(() => {
    execCommand('insertHTML', '<hr style="border: none; height: 2px; background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent); margin: 2rem 0;">');
  }, [execCommand]);

  const insertParagraph = useCallback(() => {
    execCommand('insertHTML', '<p></p>');
  }, [execCommand]);

  const insertHeading = useCallback((level: number) => {
    execCommand('formatBlock', `h${level}`);
  }, [execCommand]);

  const insertBlockquote = useCallback(() => {
    execCommand('formatBlock', 'blockquote');
  }, [execCommand]);

  const clearFormatting = useCallback(() => {
    execCommand('removeFormat');
  }, [execCommand]);

  const selectAll = useCallback(() => {
    execCommand('selectAll');
  }, [execCommand]);

  const copyContent = useCallback(() => {
    execCommand('copy');
  }, [execCommand]);

  const cutContent = useCallback(() => {
    execCommand('cut');
  }, [execCommand]);

  const pasteContent = useCallback(() => {
    execCommand('paste');
  }, [execCommand]);

  const insertText = useCallback((text: string) => {
    execCommand('insertText', text);
  }, [execCommand]);

  const insertHTML = useCallback((html: string) => {
    execCommand('insertHTML', html);
  }, [execCommand]);

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

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

  // Handle key down
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle shortcuts only for specific Ctrl/Cmd combinations
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
        // Allow all other keys to work normally (including Space, letters, numbers, etc.)
        default:
          // Don't prevent default for normal typing keys
          break;
      }
    }
    // For non-Ctrl/Cmd keys, allow normal behavior (including Space, Enter, etc.)
  }, [execCommand, onSave, undo, redo]);

  // Insert emoji
  const insertEmoji = useCallback((emoji: string) => {
    execCommand('insertText', emoji);
    setShowEmojiPicker(false);
  }, [execCommand]);

  // Insert link
  const insertLink = useCallback(() => {
    if (linkUrl) {
      if (linkText) {
        // Insert link with custom text
        const linkHTML = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        insertHTML(linkHTML);
      } else {
        // Insert link with selected text or URL as text
        const selection = window.getSelection();
        if (selection && selection.toString()) {
          execCommand('createLink', linkUrl);
        } else {
          const linkHTML = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkUrl}</a>`;
          insertHTML(linkHTML);
        }
      }
    }
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  }, [linkUrl, linkText, insertHTML, execCommand]);

  // Insert image
  const insertImage = useCallback(() => {
    if (imageUrl) {
      const imgTag = `<img src="${imageUrl}" alt="${imageAlt || 'Image'}" ${imageWidth ? `width="${imageWidth}"` : ''} ${imageHeight ? `height="${imageHeight}"` : ''} style="max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);">`;
      insertHTML(imgTag);
    }
    setShowImageDialog(false);
    setImageUrl('');
    setImageAlt('');
    setImageWidth('');
    setImageHeight('');
  }, [imageUrl, imageAlt, imageWidth, imageHeight, insertHTML]);

  // Insert table
  const insertTable = useCallback(() => {
    let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 1.5rem 0; background: rgba(255, 255, 255, 0.05); border-radius: 8px; overflow: hidden;">';
    for (let i = 0; i < tableRows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < tableCols; j++) {
        const isHeader = i === 0;
        const tag = isHeader ? 'th' : 'td';
        const style = isHeader 
          ? 'padding: 12px; border: 1px solid rgba(255, 255, 255, 0.1); text-align: left; background: rgba(59, 130, 246, 0.2); font-weight: 600; color: #ffffff;'
          : 'padding: 12px; border: 1px solid rgba(255, 255, 255, 0.1); text-align: left; color: rgba(255, 255, 255, 0.9);';
        tableHTML += `<${tag} style="${style}">&nbsp;</${tag}>`;
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</table>';
    insertHTML(tableHTML);
    setShowTableDialog(false);
  }, [tableRows, tableCols, insertHTML]);

  // Insert code
  const insertCode = useCallback(() => {
    if (codeContent) {
      const codeTag = `<pre style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 1rem; margin: 1.5rem 0; overflow-x: auto; font-family: 'Courier New', monospace; color: #ffffff;"><code class="language-${codeLanguage}">${codeContent}</code></pre>`;
      insertHTML(codeTag);
    }
    setShowCodeDialog(false);
    setCodeContent('');
  }, [codeContent, codeLanguage, insertHTML]);

  // Search and replace
  const searchAndReplace = useCallback(() => {
    if (searchTerm) {
      const newContent = content.replace(new RegExp(searchTerm, 'g'), replaceTerm);
      onChange(newContent);
    }
    setShowSearchReplace(false);
    setSearchTerm('');
    setReplaceTerm('');
  }, [searchTerm, replaceTerm, content, onChange]);

  // Spell check functionality
  const performSpellCheck = useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.innerText;
      const words = text.split(/\s+/).filter(word => word.length > 0);
      const misspelledWords: Array<{word: string; index: number; suggestions: string[]}> = [];
      
      // Simple spell check - in a real implementation, you'd use a proper spell check library
      words.forEach((word, index) => {
        // Remove punctuation for checking
        const cleanWord = word.replace(/[^\w]/g, '');
        if (cleanWord.length > 2 && !/^[A-Z]+$/.test(cleanWord)) {
          // This is a simplified check - in reality you'd check against a dictionary
          if (Math.random() < 0.1) { // Simulate 10% misspelling rate
            misspelledWords.push({
              word: cleanWord,
              index: index,
              suggestions: [cleanWord + '1', cleanWord + '2', cleanWord + '3']
            });
          }
        }
      });
      
      setSpellCheckResults(misspelledWords);
    }
  }, []);

  // Replace misspelled word
  const replaceMisspelledWord = useCallback((oldWord: string, newWord: string) => {
    const newContent = content.replace(new RegExp(oldWord, 'g'), newWord);
    onChange(newContent);
    setSpellCheckResults(prev => prev.filter(item => item.word !== oldWord));
  }, [content, onChange]);


  // Insert date/time
  const insertDateTime = useCallback(() => {
    const now = new Date();
    const dateTime = now.toLocaleString();
    insertText(dateTime);
  }, [insertText]);

  // Insert page break
  const insertPageBreak = useCallback(() => {
    insertHTML('<div style="page-break-before: always;"></div>');
  }, [insertHTML]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Export content
  const exportContent = useCallback(() => {
    onExport?.();
  }, [onExport]);

  // Import content
  const importContent = useCallback(() => {
    onImport?.();
  }, [onImport]);

  // Save content
  const saveContent = useCallback(() => {
    onSave?.();
  }, [onSave]);

  // Preview content
  const previewContent = useCallback(() => {
    onPreview?.();
  }, [onPreview]);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (file.type.startsWith('image/')) {
          setImageUrl(result);
          setImageAlt(file.name);
        } else {
          // Handle other file types
          const fileTag = `<a href="${result}" download="${file.name}">${file.name}</a>`;
          insertHTML(fileTag);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [insertHTML]);

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
    
    // Font controls
    { id: 'font-family', icon: FaFont, title: 'Font Family', action: () => applyFontFamily(selectedFontFamily), group: 'font' },
    { id: 'font-size', icon: FaTextHeight, title: 'Font Size', action: () => applyFontSize(selectedFontSize), group: 'font' },
    { id: 'text-color', icon: FaPalette, title: 'Text Color', action: () => applyTextColor(selectedTextColor), group: 'font' },
    { id: 'highlight', icon: FaHighlighter, title: 'Highlight Color', action: () => applyHighlightColor(selectedHighlightColor), group: 'font' },
    
    // Alignment
    { id: 'align-left', icon: FaAlignLeft, title: 'Align Left', action: () => execCommand('justifyLeft'), active: currentFormat.justifyLeft, group: 'align' },
    { id: 'align-center', icon: FaAlignCenter, title: 'Align Center', action: () => execCommand('justifyCenter'), active: currentFormat.justifyCenter, group: 'align' },
    { id: 'align-right', icon: FaAlignRight, title: 'Align Right', action: () => execCommand('justifyRight'), active: currentFormat.justifyRight, group: 'align' },
    { id: 'align-justify', icon: FaAlignJustify, title: 'Justify', action: () => execCommand('justifyFull'), active: currentFormat.justifyFull, group: 'align' },
    
    // Lists and indentation
    { id: 'bullet-list', icon: FaListUl, title: 'Bullet List', action: () => execCommand('insertUnorderedList'), active: currentFormat.insertUnorderedList, group: 'list' },
    { id: 'numbered-list', icon: FaListOl, title: 'Numbered List', action: () => execCommand('insertOrderedList'), active: currentFormat.insertOrderedList, group: 'list' },
    { id: 'indent', icon: FaIndent, title: 'Indent', action: () => execCommand('indent'), active: currentFormat.indent, group: 'list' },
    { id: 'outdent', icon: FaOutdent, title: 'Outdent', action: () => execCommand('outdent'), active: currentFormat.outdent, group: 'list' },
    
    // Block formatting
    { id: 'heading', icon: FaHeading, title: 'Heading', action: () => insertHeading(2), group: 'block' },
    { id: 'paragraph', icon: FaParagraph, title: 'Paragraph', action: () => insertParagraph(), group: 'block' },
    { id: 'blockquote', icon: FaQuoteLeft, title: 'Blockquote', action: () => insertBlockquote(), group: 'block' },
    { id: 'horizontal-rule', icon: FaMinus, title: 'Horizontal Rule', action: () => insertHorizontalRule(), group: 'block' },
    
    // Insert
    { id: 'link', icon: FaLink, title: 'Insert Link (Ctrl+K)', action: () => setShowLinkDialog(true), disabled: !allowLinks, group: 'insert' },
    { id: 'image', icon: FaImage, title: 'Insert Image', action: () => setShowImageDialog(true), disabled: !allowImages, group: 'insert' },
    { id: 'table', icon: FaTable, title: 'Insert Table', action: () => setShowTableDialog(true), disabled: !allowTables, group: 'insert' },
    { id: 'code', icon: FaCode, title: 'Insert Code', action: () => setShowCodeDialog(true), disabled: !allowCode, group: 'insert' },
    { id: 'emoji', icon: FaSmile, title: 'Insert Emoji', action: () => setShowEmojiPicker(!showEmojiPicker), disabled: !allowEmojis, group: 'insert' },
    
    // Clipboard operations
    { id: 'cut', icon: FaCut, title: 'Cut (Ctrl+X)', action: () => cutContent(), group: 'clipboard' },
    { id: 'copy', icon: FaCopy, title: 'Copy (Ctrl+C)', action: () => copyContent(), group: 'clipboard' },
    { id: 'paste', icon: FaPaste, title: 'Paste (Ctrl+V)', action: () => pasteContent(), group: 'clipboard' },
    { id: 'select-all', icon: FaTextWidth, title: 'Select All (Ctrl+A)', action: () => selectAll(), group: 'clipboard' },
    
    // Tools
    { id: 'search', icon: FaSearch, title: 'Search (Ctrl+F)', action: () => setShowSearchReplace(true), group: 'tools' },
    { id: 'spell-check', icon: FaSpellCheck, title: 'Spell Check', action: () => { setShowSpellCheck(!showSpellCheck); if (!showSpellCheck) performSpellCheck(); }, group: 'tools' },
    { id: 'clear-format', icon: FaEraser, title: 'Clear Formatting', action: () => clearFormatting(), group: 'tools' },
    { id: 'fullscreen', icon: isFullscreen ? FaCompress : FaExpand, title: 'Toggle Fullscreen', action: () => toggleFullscreen(), group: 'tools' },
    
    // Special insertions
    { id: 'date-time', icon: FaCalendarAlt, title: 'Insert Date/Time', action: () => insertDateTime(), group: 'special' },
    { id: 'page-break', icon: FaFileAlt, title: 'Page Break', action: () => insertPageBreak(), group: 'special' },
    
    // Actions
    { id: 'save', icon: FaSave, title: 'Save (Ctrl+S)', action: () => saveContent(), group: 'actions' },
    { id: 'preview', icon: FaEye, title: 'Preview', action: () => previewContent(), group: 'actions' },
    { id: 'export', icon: FaDownload, title: 'Export', action: () => exportContent(), group: 'actions' },
    { id: 'import', icon: FaUpload, title: 'Import', action: () => importContent(), group: 'actions' }
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
          suppressContentEditableWarning={true}
          onInput={handleContentChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onMouseUp={updateFormat}
          onKeyUp={updateFormat}
          style={{ minHeight: '400px' }}
          data-placeholder={placeholder}
        >
          {/* Content will be managed by the contenteditable itself */}
        </div>
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
              type="url"
              placeholder="Link URL (e.g., https://example.com)"
              className="link-url-input"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            <input
              type="text"
              placeholder="Link Text (optional)"
              className="link-text-input"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
            />
            <div className="dialog-actions">
              <button onClick={() => setShowLinkDialog(false)}>Cancel</button>
              <button onClick={insertLink} disabled={!linkUrl}>Insert Link</button>
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
              placeholder="Image URL (e.g., https://example.com/image.jpg)"
              className="image-url-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <input
              type="text"
              placeholder="Alt Text (for accessibility)"
              className="image-alt-input"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
            />
            <div className="image-dimensions">
              <input
                type="number"
                placeholder="Width (px)"
                className="image-width-input"
                value={imageWidth}
                onChange={(e) => setImageWidth(e.target.value)}
              />
              <input
                type="number"
                placeholder="Height (px)"
                className="image-height-input"
                value={imageHeight}
                onChange={(e) => setImageHeight(e.target.value)}
              />
            </div>
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
              <button onClick={insertImage} disabled={!imageUrl}>Insert Image</button>
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
              <input 
                type="number" 
                min="1" 
                max="20" 
                value={tableRows}
                onChange={(e) => setTableRows(parseInt(e.target.value) || 3)}
              />
              <label>Columns:</label>
              <input 
                type="number" 
                min="1" 
                max="20" 
                value={tableCols}
                onChange={(e) => setTableCols(parseInt(e.target.value) || 3)}
              />
            </div>
            <div className="table-preview">
              <p>Preview: {tableRows} rows × {tableCols} columns</p>
            </div>
            <div className="dialog-actions">
              <button onClick={() => setShowTableDialog(false)}>Cancel</button>
              <button onClick={insertTable}>Insert Table</button>
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
            <select 
              className="code-language-select"
              value={codeLanguage}
              onChange={(e) => setCodeLanguage(e.target.value)}
            >
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="csharp">C#</option>
              <option value="php">PHP</option>
              <option value="sql">SQL</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="markdown">Markdown</option>
              <option value="bash">Bash</option>
              <option value="powershell">PowerShell</option>
              <option value="yaml">YAML</option>
              <option value="dockerfile">Dockerfile</option>
            </select>
            <textarea
              placeholder="Enter your code here..."
              className="code-textarea"
              rows={10}
              value={codeContent}
              onChange={(e) => setCodeContent(e.target.value)}
            />
            <div className="dialog-actions">
              <button onClick={() => setShowCodeDialog(false)}>Cancel</button>
              <button onClick={insertCode} disabled={!codeContent.trim()}>Insert Code</button>
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
              <button onClick={searchAndReplace} disabled={!searchTerm.trim()}>Replace All</button>
            </div>
          </div>
        </div>
      )}

      {/* Spell Check Results */}
      {showSpellCheck && spellCheckResults.length > 0 && (
        <div className="spell-check-results">
          <div className="spell-check-header">
            <h4>Spell Check Results</h4>
            <button onClick={() => setShowSpellCheck(false)} title="Close spell check">
              <FaTimes />
            </button>
          </div>
          <div className="spell-check-content">
            {spellCheckResults.map((result, index) => (
              <div key={index} className="spell-check-item">
                <span className="misspelled-word">{result.word}</span>
                <div className="suggestions">
                  {result.suggestions.map((suggestion: string, i: number) => (
                    <button
                      key={i}
                      className="suggestion-btn"
                      onClick={() => replaceMisspelledWord(result.word, suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <button
                  className="ignore-btn"
                  onClick={() => setSpellCheckResults(prev => prev.filter(item => item.word !== result.word))}
                >
                  Ignore
                </button>
              </div>
            ))}
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
