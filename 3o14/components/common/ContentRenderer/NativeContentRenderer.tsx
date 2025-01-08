import React from 'react';
// @ts-ignore
import MathJax from 'react-native-mathjax';
import { useTheme } from '@/hooks/useTheme';
import { mmlOptions } from './MathJaxConfig';
import type { ContentRendererProps } from './types';

export const NativeContentRenderer: React.FC<ContentRendererProps> = ({
  content,
}) => {
  const theme = useTheme();

  const mathJaxStyle = `
    <style>
      body {
        background-color: ${theme.colors.background};
        color: ${theme.colors.text};
        padding-left: 40;
        padding-right: 8;
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
      }
    </style>
  `;

  return (
    <MathJax
      mathJaxOptions={mmlOptions}
      html={`${mathJaxStyle}${content}`}
    />
  );
};
