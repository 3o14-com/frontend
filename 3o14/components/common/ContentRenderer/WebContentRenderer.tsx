import React, { useState, useEffect, memo } from 'react';
import { Text } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { MathJaxContext, MathJax as WebMathJax } from 'better-react-mathjax';
import { mathJaxConfig } from './MathJaxConfig';
import type { ContentRendererProps } from './types';

declare global {
  interface Window {
    MathJax?: {
      startup?: {
        promise: Promise<void>;
      };
    };
  }
}

const containsLatexDelimiters = (content: string = ''): boolean => {
  // Check for display math \[ \] or inline math \( \)
  // Using regex with 's' flag to match across multiple lines
  const displayMathPattern = /\\\[[\s\S]*?\\\]/;
  const inlineMathPattern = /\\\([\s\S]*?\\\)/;
  return displayMathPattern.test(content) || inlineMathPattern.test(content);
};

const WebDisplay = memo(function WebDisplay({
  html,
  width,
  tagsStyles = {},
  renderersProps = {},
  systemFonts = [],
}: {
  html: string;
  width: number;
  tagsStyles?: Record<string, any>;
  renderersProps?: Record<string, any>;
  systemFonts?: string[];
}) {
  return (
    <RenderHTML
      contentWidth={width}
      source={{ html }}
      systemFonts={systemFonts}
      tagsStyles={tagsStyles}
      renderersProps={renderersProps}
      defaultTextProps={{ selectable: true }}
      enableExperimentalMarginCollapsing={true}
    />
  );
});

const MathJaxWrapper = memo(function MathJaxWrapper({
  content,
  width,
  tagsStyles,
  renderersProps,
  systemFonts,
}: {
  content: string;
  width: number;
  tagsStyles?: Record<string, any>;
  renderersProps?: Record<string, any>;
  systemFonts?: string[];
}) {
  const [mathReady, setMathReady] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const checkMathJax = async () => {
      try {
        await window.MathJax?.startup?.promise;
        setMathReady(true);
        setKey((prev) => prev + 1);
      } catch (error) {
        console.error("MathJax failed to initialize", error);
      }
    };
    checkMathJax();
  }, []);

  if (!mathReady) {
    return <Text>...</Text>;
  }

  return (
    <MathJaxContext key={key} config={mathJaxConfig}>
      <WebMathJax dynamic onError={(error) => console.error('MathJax error:', error)}>
        <WebDisplay
          html={content}
          width={width}
          tagsStyles={tagsStyles}
          renderersProps={renderersProps}
          systemFonts={systemFonts}
        />
      </WebMathJax>
    </MathJaxContext>
  );
});

export const WebContentRenderer: React.FC<ContentRendererProps> = ({
  content = '',
  width,
  tagsStyles = {},
  renderersProps = {},
  systemFonts = [],
}) => {
  if (!content) {
    return <Text>...</Text>;
  }

  const hasMathContent = containsLatexDelimiters(content);

  if (hasMathContent) {
    return (
      <MathJaxWrapper
        content={content}
        width={width}
        tagsStyles={tagsStyles}
        renderersProps={renderersProps}
        systemFonts={systemFonts}
      />
    );
  }

  return (
    <WebDisplay
      html={content}
      width={width}
      tagsStyles={tagsStyles}
      renderersProps={renderersProps}
      systemFonts={systemFonts}
    />
  );
};
