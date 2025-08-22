import React, { useState, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, FileDown, FileUp, Copy, CheckCircle, Eye, EyeOff, Info, Upload, X, TestTube } from "lucide-react";
import { generateXML, sampleXML, formatXMLString } from "@/core/bt/xml-utils";
import { Node, Edge } from "reactflow";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/use-i18n";
import { parseXMLUnified, applyLayoutUnified, behaviorTreeManager } from '@/core/bt/unified-behavior-tree-manager';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (nodes: Node[], edges: Edge[]) => void;
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
    const { t } = useI18n()
  const [xml, setXml] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError(t("xml:pleaseSelectXmlFile"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setXml(content);
      setFileName(file.name);
      setError(undefined);
    };
    reader.onerror = () => {
      setError(t("xml:fileReadFailed"));
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleImport = async () => {
    if (!xml.trim()) {
      setError(t("xml:pleaseSelectOrInputXml"));
      return;
    }

    // 使用统一管理器解析XML
    try {
      const behaviorTreeData = await parseXMLUnified(xml, 'file', fileName || `file_${Date.now()}`);
      const layoutedNodes = await applyLayoutUnified(behaviorTreeData.id);
      const runtimeData = behaviorTreeManager.getRuntimeData(behaviorTreeData.id);

      if (!runtimeData) {
        throw new Error('Failed to get runtime data');
      }

      onImport(layoutedNodes, runtimeData.edges);
      onOpenChange(false);
      setError(undefined);

      toast({
        title: t("messages:importSuccess"),
        description: fileName ? t("xml:importedFile", { fileName }) : t("xml:xmlContentImportedSuccessfully"),
      });
    } catch (error) {
      console.error(t("xml:parseFailed"), error);
      setError(error instanceof Error ? error.message : t("xml:parseFailed"));
    }
  };

  const handleClear = () => {
    setXml("");
    setFileName("");
    setError(undefined);
    // 清除文件输入
    const fileInput = document.getElementById('xml-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleLoadSample = () => {
    setXml(sampleXML);
    setFileName(t("xml:sampleBehaviorTree"));
    setError(undefined);

    toast({
      title: t("xml:sampleXmlLoaded"),
      description: t("xml:canImportDirectlyOrModify"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t("xml:importBehaviorTreeXml")}</DialogTitle>
          <DialogDescription>
            选择XML文件或直接粘贴XML内容，将其转换为可视化行为树。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 文件选择区域 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("xml:selectFile")}</span>
            </div>

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                id="xml-file-input"
                type="file"
                accept=".xml"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <FileUp className="mr-2 h-4 w-4" />
                {t("xml:selectXmlFile")}
              </Button>

              {fileName && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md flex-1">
                  <span className="text-sm truncate">{fileName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* 文本输入区域 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">            {t("xml:orDirectInputXml")}</span>
            </div>

            <Textarea
              value={xml}
              onChange={(e) => setXml(e.target.value)}
              className="font-mono text-xs h-[250px] resize-none"
              placeholder={t("xml:pasteXmlContentHere")}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
              {t("common:cancel")}
            </Button>
            <Button
              variant="secondary"
              onClick={handleLoadSample}
              className="flex-1 sm:flex-none"
            >
              <TestTube className="mr-2 h-4 w-4" />
                            {t("xml:sampleXml")}
            </Button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {xml && (
              <Button variant="secondary" onClick={handleClear} className="flex-1 sm:flex-none">
                {t("common:clear")}
              </Button>
            )}
            <Button onClick={handleImport} disabled={!xml.trim()} className="flex-1 sm:flex-none">
              <FileUp className="mr-2 h-4 w-4" />
                            {t("common:import")}
            </Button>
          </div>
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
  const { t } = useI18n()
  const [xml, setXml] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [showFormatted, setShowFormatted] = useState(true);
  const [validationInfo, setValidationInfo] = useState<{
    nodeCount: number;
    edgeCount: number;
    hasRoot: boolean;
    warnings: string[];
  } | null>(null);
  const { toast } = useToast();

  // 当对话框打开时生成XML
  React.useEffect(() => {
    if (open) {
      const result = generateXML(nodes, edges);
      setXml(result.xml);
      setError(result.error);

      // 生成验证信息
      if (!result.error) {
        const targetNodeIds = new Set(edges.map(e => e.target));
        const rootNodes = nodes.filter(node => !targetNodeIds.has(node.id));
        const warnings: string[] = [];

        // 检查常见问题
        if (nodes.length === 0) {
          warnings.push(t("xml:emptyBehaviorTree"));
        }
        if (rootNodes.length === 0 && nodes.length > 0) {
          warnings.push(t("xml:noRootNodeFound"));
        }
        if (rootNodes.length > 1) {
          warnings.push(t("xml:multipleRootNodes", { count: rootNodes.length }));
        }

        // 检查孤立节点
        const connectedNodes = new Set([...edges.map(e => e.source), ...edges.map(e => e.target)]);
        const isolatedNodes = nodes.filter(node => !connectedNodes.has(node.id) && rootNodes.length > 0);
        if (isolatedNodes.length > 0) {
          warnings.push(t("xml:isolatedNodesFound", { count: isolatedNodes.length }));
        }

        setValidationInfo({
          nodeCount: nodes.length,
          edgeCount: edges.length,
          hasRoot: rootNodes.length === 1,
          warnings
        });
      } else {
        setValidationInfo(null);
      }
    }
  }, [open, nodes, edges]);

  const handleDownload = () => {
    if (!xml) return;

    const blob = new Blob([xml], { type: "text/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "behavior_tree.xml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: t("xml:downloadSuccess"),
      description: t("xml:fileDownloadedToFolder"),
    });
  };

  const handleCopy = async () => {
    if (!xml) return;

    try {
      await navigator.clipboard.writeText(xml);
      toast({
        title: t("xml:copySuccess"),
        description: t("xml:xmlCopiedToClipboard"),
      });
    } catch (err) {
      console.error(t("xml:cannotCopyToClipboard"), err);
      toast({
        title: t("xml:copyFailed"),
        description: t("xml:cannotAccessClipboard"),
        variant: "destructive",
      });
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
                        {t("xml:exportBehaviorTreeXml")}
            {validationInfo && (
              <Badge variant={validationInfo.hasRoot && validationInfo.warnings.length === 0 ? "default" : "secondary"}>
                {t("xml:nodeCount", { count: validationInfo.nodeCount })}, {t("xml:edgeCount", { count: validationInfo.edgeCount })}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
                        {t("xml:currentTreeConvertedDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 验证信息 */}
          {validationInfo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("xml:validationResult")}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFormatted(!showFormatted)}
                  className="h-6 px-2"
                >
                  {showFormatted ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showFormatted ? t("xml:raw") : t("xml:formatted")}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant={validationInfo.hasRoot ? "default" : "destructive"}>
                  {validationInfo.hasRoot ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                  {validationInfo.hasRoot ? t("xml:validRootNode") : t("xml:missingRootNode")}
                </Badge>

                {validationInfo.warnings.length === 0 ? (
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t("xml:structureNormal")}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {t("xml:warningCount", { count: validationInfo.warnings.length })}
                  </Badge>
                )}
              </div>

              {validationInfo.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {validationInfo.warnings.map((warning, index) => (
                        <div key={index} className="text-sm">• {warning}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Separator />
            </div>
          )}

          {/* XML 内容 */}
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Textarea
              value={showFormatted ? formatXMLString(xml) : xml}
              readOnly
              className="font-mono text-xs h-[300px] resize-none"
              placeholder={t("xml:generatedXmlWillShow")}
            />
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
                            {t("common:close")}
            </Button>
            <Button
              variant="secondary"
              onClick={handleCopy}
              disabled={!!error}
              className="flex-1 sm:flex-none"
            >
              <Copy className="mr-2 h-4 w-4" />
                            {t("common:copy")}
            </Button>
          </div>
          <Button
            onClick={handleDownload}
            disabled={!!error}
            className="w-full sm:w-auto"
          >
            <FileDown className="mr-2 h-4 w-4" />
                        {t("xml:downloadXml")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}