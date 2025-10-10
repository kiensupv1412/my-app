'use client';

import * as React from 'react';

export function HtmlIframe({
  html,
  ...props
}: {
  html: string;
} & React.ComponentProps<'iframe'>) {

  return <iframe title="Preview" srcDoc={html} {...props} />;
}