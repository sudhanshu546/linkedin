import React, { useRef, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBold, faItalic, faUnderline, faListUl, faListOl, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { getAllUsers } from '../../api/userApi';
import { TUserDTO } from '../../types';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [users, setUsers] = useState<TUserDTO[]>([]);
  const [mentionPos, setMentionPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  useEffect(() => {
    if (showMentions) {
        getAllUsers().then(res => {
            setUsers(res.filter(u => 
                (u.firstName + ' ' + u.lastName).toLowerCase().includes(mentionQuery.toLowerCase())
            ).slice(0, 5));
        });
    }
  }, [showMentions, mentionQuery]);

  const execCommand = (command: string) => {
    document.execCommand(command, false, '');
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);

      // Simple mention detection
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const textBeforeCaret = range.startContainer.textContent?.substring(0, range.startOffset) || '';
          const atIndex = textBeforeCaret.lastIndexOf('@');
          
          if (atIndex !== -1 && !textBeforeCaret.substring(atIndex).includes(' ')) {
              const query = textBeforeCaret.substring(atIndex + 1);
              setMentionQuery(query);
              setShowMentions(true);
              
              const rect = range.getBoundingClientRect();
              setMentionPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
          } else {
              setShowMentions(false);
          }
      }
    }
  };

  const insertMention = (user: TUserDTO) => {
    if (editorRef.current) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const textNode = range.startContainer;
            const atIndex = textNode.textContent?.lastIndexOf('@', range.startOffset) || 0;
            
            range.setStart(textNode, atIndex);
            range.setEnd(textNode, range.startOffset);
            range.deleteContents();

            const mentionNode = document.createElement('span');
            mentionNode.className = 'mention-chip';
            mentionNode.style.color = '#0a66c2';
            mentionNode.style.fontWeight = '600';
            mentionNode.style.backgroundColor = '#eef3f8';
            mentionNode.style.padding = '2px 4px';
            mentionNode.style.borderRadius = '4px';
            mentionNode.contentEditable = 'false';
            mentionNode.textContent = `@${user.firstName} ${user.lastName}`;
            mentionNode.dataset.userId = user.id;

            range.insertNode(mentionNode);
            
            // Add a space after mention
            const spaceNode = document.createTextNode('\u00A0');
            mentionNode.after(spaceNode);
            
            // Move cursor after space
            const newRange = document.createRange();
            newRange.setStartAfter(spaceNode);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);

            onChange(editorRef.current.innerHTML);
            setShowMentions(false);
        }
    }
  };

  return (
    <div className="rich-text-editor-container" style={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'visible', position: 'relative' }}>
      <div className="editor-toolbar" style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #eee', padding: '8px', display: 'flex', gap: '8px' }}>
        <button type="button" onClick={() => execCommand('bold')} className="toolbar-btn" title="Bold">
          <FontAwesomeIcon icon={faBold} />
        </button>
        <button type="button" onClick={() => execCommand('italic')} className="toolbar-btn" title="Italic">
          <FontAwesomeIcon icon={faItalic} />
        </button>
        <button type="button" onClick={() => execCommand('underline')} className="toolbar-btn" title="Underline">
          <FontAwesomeIcon icon={faUnderline} />
        </button>
        <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 4px' }} />
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="toolbar-btn" title="Bullet List">
          <FontAwesomeIcon icon={faListUl} />
        </button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="toolbar-btn" title="Numbered List">
          <FontAwesomeIcon icon={faListOl} />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="post-textarea-main"
        style={{ 
          minHeight: '120px', 
          padding: '12px', 
          outline: 'none', 
          backgroundColor: '#fff',
          overflowY: 'auto'
        }}
        data-placeholder={placeholder}
      />

      {showMentions && users.length > 0 && (
          <div className="mention-dropdown" style={{ 
              position: 'fixed', 
              top: mentionPos.top, 
              left: mentionPos.left,
              backgroundColor: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: '8px',
              zIndex: 10000,
              width: '200px',
              border: '1px solid #eee'
          }}>
              {users.map(u => (
                  <div 
                    key={u.id} 
                    className="mention-item" 
                    onClick={() => insertMention(u)}
                    style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                      <FontAwesomeIcon icon={faUserCircle} style={{ color: '#adb3b8' }} />
                      <div style={{ fontSize: '13px' }}>
                          <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                      </div>
                  </div>
              ))}
          </div>
      )}

      <style>{`
        .toolbar-btn {
          background: none;
          border: 1px solid transparent;
          padding: 4px 8px;
          border-radius: 3px;
          cursor: pointer;
          color: #666;
        }
        .toolbar-btn:hover {
          background-color: #eee;
          color: #0a66c2;
        }
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #888;
          pointer-events: none;
          display: block; /* For Firefox */
        }
        .mention-item:hover {
            background-color: #f3f2ef;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
