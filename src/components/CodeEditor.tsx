import { useState } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/themes/prism-tomorrow.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CodeEditor = ({ value, onChange, disabled }: CodeEditorProps) => {
  const [language, setLanguage] = useState("typescript");

  const getLanguage = () => {
    switch (language) {
      case "javascript":
        return Prism.languages.javascript;
      case "typescript":
        return Prism.languages.tsx;
      case "python":
        return Prism.languages.python;
      case "java":
        return Prism.languages.java;
      case "css":
        return Prism.languages.css;
      case "html":
        return Prism.languages.markup;
      default:
        return Prism.languages.tsx;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="code-language">Code Language</Label>
        <Select value={language} onValueChange={setLanguage} disabled={disabled}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="typescript">TypeScript</SelectItem>
            <SelectItem value="javascript">JavaScript</SelectItem>
            <SelectItem value="python">Python</SelectItem>
            <SelectItem value="java">Java</SelectItem>
            <SelectItem value="css">CSS</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border border-border overflow-hidden bg-muted/50">
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={(code) => Prism.highlight(code, getLanguage(), language)}
          padding={16}
          disabled={disabled}
          className="font-mono text-sm min-h-[200px]"
          style={{
            fontFamily: '"Fira Code", "Fira Mono", monospace',
            backgroundColor: "transparent",
          }}
          textareaClassName="focus:outline-none"
        />
      </div>
    </div>
  );
};

export default CodeEditor;
