import { useEffect, useState, useRef } from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface StreamingMessageProps {
  content: string;
  isComplete: boolean;
}

export function StreamingMessage({ content, isComplete }: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const contentRef = useRef('');

  useEffect(() => {
    if (isComplete) {
      setDisplayedContent(content);
      return;
    }

    // Animate the content appearing word by word
    const newContent = content;
    const prevLength = contentRef.current.length;
    
    if (newContent.length > prevLength) {
      // Only animate new content
      const newChars = newContent.slice(prevLength);
      let charIndex = 0;
      
      const interval = setInterval(() => {
        if (charIndex < newChars.length) {
          setDisplayedContent(prev => prev + newChars[charIndex]);
          charIndex++;
        } else {
          clearInterval(interval);
        }
      }, 15); // Fast typing effect

      contentRef.current = newContent;
      return () => clearInterval(interval);
    }
  }, [content, isComplete]);

  return (
    <div className="relative">
      <MarkdownRenderer content={displayedContent} />
      {!isComplete && (
        <span className="inline-block w-2 h-4 bg-primary/80 animate-pulse ml-0.5" />
      )}
    </div>
  );
}
