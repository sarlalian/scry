export interface AtlassianDocument {
  type: "doc";
  version: 1;
  content: AtlassianNode[];
}

export type AtlassianNode =
  | ParagraphNode
  | HeadingNode
  | BulletListNode
  | OrderedListNode
  | CodeBlockNode
  | BlockquoteNode
  | RuleNode
  | TableNode
  | MediaGroupNode;

export interface ParagraphNode {
  type: "paragraph";
  content?: InlineNode[];
}

export interface HeadingNode {
  type: "heading";
  attrs: { level: 1 | 2 | 3 | 4 | 5 | 6 };
  content?: InlineNode[];
}

export interface BulletListNode {
  type: "bulletList";
  content: ListItemNode[];
}

export interface OrderedListNode {
  type: "orderedList";
  content: ListItemNode[];
}

export interface ListItemNode {
  type: "listItem";
  content: AtlassianNode[];
}

export interface CodeBlockNode {
  type: "codeBlock";
  attrs?: { language?: string };
  content?: TextNode[];
}

export interface BlockquoteNode {
  type: "blockquote";
  content: AtlassianNode[];
}

export interface RuleNode {
  type: "rule";
}

export interface TableNode {
  type: "table";
  content: TableRowNode[];
}

export interface TableRowNode {
  type: "tableRow";
  content: TableCellNode[];
}

export interface TableCellNode {
  type: "tableCell" | "tableHeader";
  attrs?: { colspan?: number; rowspan?: number };
  content: AtlassianNode[];
}

export interface MediaGroupNode {
  type: "mediaGroup";
  content: MediaSingleNode[];
}

export interface MediaSingleNode {
  type: "mediaSingle";
  attrs?: { layout?: string };
  content: MediaNode[];
}

export interface MediaNode {
  type: "media";
  attrs: {
    id: string;
    type: "file" | "link";
    collection?: string;
  };
}

export type InlineNode = TextNode | HardBreakNode | MentionNode | EmojiNode | InlineCardNode;

export interface TextNode {
  type: "text";
  text: string;
  marks?: Mark[];
}

export interface HardBreakNode {
  type: "hardBreak";
}

export interface MentionNode {
  type: "mention";
  attrs: {
    id: string;
    text?: string;
    accessLevel?: string;
  };
}

export interface EmojiNode {
  type: "emoji";
  attrs: {
    shortName: string;
    id?: string;
    text?: string;
  };
}

export interface InlineCardNode {
  type: "inlineCard";
  attrs: {
    url: string;
  };
}

export interface Mark {
  type: "strong" | "em" | "code" | "link" | "strike" | "underline" | "textColor" | "subsup";
  attrs?: Record<string, unknown>;
}

export interface JiraErrorResponse {
  errorMessages?: string[];
  errors?: Record<string, string>;
}
