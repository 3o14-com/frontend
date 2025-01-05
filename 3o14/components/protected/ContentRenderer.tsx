import React, { useState, useEffect } from 'react';
import { Platform, ActivityIndicator, View } from 'react-native';
import RenderHTML, { defaultSystemFonts, MixedStyleDeclaration } from 'react-native-render-html';
import { MathJaxContext, MathJax as WebMathJax } from 'better-react-mathjax';
// @ts-ignore
import MathJax from 'react-native-mathjax';
import { useTheme } from '@/hooks/useTheme';

interface ContentRendererProps {
  content: string;
  width: number;
  tagsStyles?: Record<string, MixedStyleDeclaration>;
  renderersProps?: any;
  systemFonts?: string[];
}

const mathJaxConfig = {
  loader: {
    load: ['input/tex', 'output/chtml'],
    timeout: 10000,
  },
  startup: {
    typeset: false,
  },
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
  },
};

const mmlOptions = {
  messageStyle: "none",
  extensions: ["tex2jax.js"],
  jax: ["input/TeX", "output/HTML-CSS"],
  tex2jax: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    processEscapes: true,
  },
  TeX: {
    extensions: ["AMSmath.js", "AMSsymbols.js", "noErrors.js", "noUndefined.js"],
  },
};

declare global {
  interface Window {
    MathJax?: {
      startup?: {
        promise: Promise<void>;
      };
    };
  }
}

const WebContentRenderer: React.FC<ContentRendererProps> = ({
  content,
  width,
  tagsStyles = {},
  renderersProps = {},
  systemFonts = defaultSystemFonts,
}) => {
  const [mathReady, setMathReady] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const checkMathJax = async () => {
      try {
        await window.MathJax?.startup?.promise;
        setMathReady(true);
        setKey(prev => prev + 1);
      } catch (error) {
        console.error("MathJax failed to initialize:", error);
      }
    };
    checkMathJax();
  }, []);

  const handleMathJaxError = (error: any) => {
    console.error('MathJax typesetting error:', error);
  };

  if (!mathReady || !content) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <MathJaxContext key={key} config={mathJaxConfig}>
      <WebMathJax onError={handleMathJaxError}>
        <RenderHTML
          contentWidth={width}
          source={{ html: content }}
          systemFonts={systemFonts}
          tagsStyles={{
            body: { margin: 0, padding: 0 },
            ...tagsStyles,
          }}
          renderersProps={{
            img: {
              enableExperimentalPercentWidth: true,
            },
            ...renderersProps,
          }}
          defaultTextProps={{
            selectable: true,
          }}
          enableExperimentalMarginCollapsing={true}
        />
      </WebMathJax>
    </MathJaxContext>
  );
};

const NativeContentRenderer: React.FC<ContentRendererProps> = ({
  content,
}) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset loading state when content changes
    setIsLoading(true);
  }, [content]);

  const mathJaxStyle = `
    <style>
      body {
        background-color: ${theme.colors.background};
        color: ${theme.colors.text};
        margin: 0;
        padding: 0;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .MathJax {
        display: inline-block;
        font-size: 1rem;
        line-height: 1.5;
        background-color: ${theme.colors.background};
        color: ${theme.colors.text};
      }
      a {
        color: ${theme.colors.primary};
        text-decoration: none;
      }
      img {
        max-width: 100%;
        height: auto;
      }
      p {
        margin: 0.5em 0;
      }
    </style>
  `;

  return (
    <View style={{ flex: 1 }}>
      {isLoading && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" />
        </View>
      )}
      <MathJax
        mathJaxOptions={mmlOptions}
        html={`${mathJaxStyle}${content}`}
        onLoad={() => setIsLoading(false)}
        style={{ opacity: isLoading ? 0 : 1 }}
      />
    </View>
  );
};

const ContentRenderer: React.FC<ContentRendererProps> = (props) => {
  if (!props.content) {
    return null;
  }

  return Platform.OS === 'web'
    ? <WebContentRenderer {...props} />
    : <NativeContentRenderer {...props} />;
};

export default ContentRenderer;
