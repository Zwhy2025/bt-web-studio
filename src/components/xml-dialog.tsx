import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FileDown, FileUp } from "lucide-react";
import { parseXML, generateXML, sampleXML } from "@/lib/xml-utils";
import { Node, Edge } from "reactflow";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (nodes: Node[], edges: Edge[]) => void;
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [xml, setXml] = useState(sampleXML);
  const [error, setError] = useState<string | undefined>();

  const handleImport = () => {
    const result = parseXML(xml);
    if (result.error) {
      setError(result.error);
      return;
    }
    
    onImport(result.nodes, result.edges);
    onOpenChange(false);
    setError(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>导入 BehaviorTree.CPP XML</DialogTitle>
          <DialogDescription>
            粘贴或编辑 BehaviorTree.CPP 格式的 XML，点击导入按钮将其转换为可视化行为树。
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Textarea
            value={xml}
            onChange={(e) => setXml(e.target.value)}
            className="font-mono text-xs h-[300px]"
            placeholder="在此粘贴 BehaviorTree.CPP XML..."
          />
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleImport}>
            <FileUp className="mr-2 h-4 w-4" />
            导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: Node[];
  edges: Edge[];
}

export function ExportDialog({ open, onOpenChange, nodes, edges }: ExportDialogProps) {
  const [xml, setXml] = useState("");
  const [error, setError] = useState<string | undefined>();

  // 当对话框打开时生成XML
  React.useEffect(() => {
    if (open) {
      const result = generateXML(nodes, edges);
      setXml(result.xml);
      setError(result.error);
    }
  }, [open, nodes, edges]);

  const handleDownload = () => {
    const blob = new Blob([xml], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "behavior_tree.xml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(xml).then(
      () => {
        // 复制成功
      },
      (err) => {
        console.error("无法复制到剪贴板:", err);
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>导出 BehaviorTree.CPP XML</DialogTitle>
          <DialogDescription>
            当前行为树已转换为 BehaviorTree.CPP 格式的 XML。您可以复制或下载此 XML 文件。
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Textarea
              value={xml}
              readOnly
              className="font-mono text-xs h-[300px]"
            />
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button variant="secondary" onClick={handleCopy} disabled={!!error}>
            复制到剪贴板
          </Button>
          <Button onClick={handleDownload} disabled={!!error}>
            <FileDown className="mr-2 h-4 w-4" />
            下载 XML
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}