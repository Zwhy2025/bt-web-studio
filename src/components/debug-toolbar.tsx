import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Plug,
  Play,
  Pause,
  StepForward,
  Square,
  CheckCircle,
  XCircle,
  AlertCircle,
  TreePine
} from 'lucide-react';

import { DEBUGGER_URL } from '@/config';
import { useBehaviorTreeStore } from '@/core/store/behavior-tree-store';

import { DebugState } from '@/core/store/behavior-tree-store';

export function DebugToolbar() {
  const {
    debugState,
    isDebuggerConnected,
    debuggerConnectionError,
    actions
  } = useBehaviorTreeStore();

  const handleConnect = () => {
    // Read URL from Vite environment variables, with a fallback to the default
    const debuggerUrl = import.meta.env.VITE_DEBUGGER_URL || 'ws://localhost:8080';
    actions.connectToDebugger(debuggerUrl);
  };

  const handleDisconnect = () => {
    actions.disconnectFromDebugger();
  };

  const handleStart = () => {
    // 发送开始命令
    actions.startExecution();
  };

  const handlePause = () => {
    // 发送暂停命令
    actions.pauseExecution();
  };

  const handleStep = () => {
    // 发送步进命令
    actions.stepExecution();
  };

  const handleStop = () => {
    // 发送停止命令
    actions.stopExecution();
  };

  const handleSimulateSubtree = () => {
    // 模拟导入的子树执行
    actions.simulateSubtree();
  };

  // 确定连接按钮的状态和图标
  let connectButtonVariant: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive" = "outline";
  let connectButtonIcon = <Plug className="h-4 w-4" />;
  let connectButtonText = "连接调试器";

  if (debugState === DebugState.CONNECTING) {
    connectButtonVariant = "secondary";
    connectButtonText = "连接中...";
  } else if (isDebuggerConnected) {
    connectButtonVariant = "default";
    connectButtonIcon = <CheckCircle className="h-4 w-4" />;
    connectButtonText = "已连接";
  }

  // 确定执行控制按钮是否禁用
  const isExecutionControlDisabled = !isDebuggerConnected ||
    debugState === DebugState.CONNECTING ||
    debugState === DebugState.DISCONNECTED;

  // 确定各个执行控制按钮的禁用状态
  const isStartDisabled = isExecutionControlDisabled || debugState === DebugState.RUNNING || debugState === DebugState.STEPPING;
  const isPauseDisabled = isExecutionControlDisabled || debugState !== DebugState.RUNNING;
  const isStepDisabled = isExecutionControlDisabled || debugState === DebugState.RUNNING || debugState === DebugState.STEPPING;
  const isStopDisabled = isExecutionControlDisabled || debugState === DebugState.STOPPED || debugState === DebugState.DISCONNECTED;

  return (
    <div className="flex items-center gap-2">
      {/* 连接状态指示器和控制按钮 */}
      <div className="flex items-center gap-1">
        {/* 状态指示灯 */}
        {debugState === DebugState.CONNECTING && (
          <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" title="正在连接" />
        )}
        {isDebuggerConnected && debugState !== DebugState.CONNECTING && (
          <div className="h-2 w-2 rounded-full bg-green-500" title="已连接" />
        )}
        {!isDebuggerConnected && debugState !== DebugState.CONNECTING && (
          <div className="h-2 w-2 rounded-full bg-gray-500" title="未连接" />
        )}

        {/* 连接/断开按钮 */}
        {isDebuggerConnected ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleDisconnect}
            disabled={debugState === DebugState.CONNECTING}
          >
            <XCircle className="h-4 w-4 mr-1" />
            断开
          </Button>
        ) : (
          <Button
            size="sm"
            variant={connectButtonVariant}
            onClick={handleConnect}
            disabled={debugState === DebugState.CONNECTING}
          >
            {connectButtonIcon}
            <span className="ml-1">{connectButtonText}</span>
          </Button>
        )}
      </div>

      {/* 分隔符 */}
      <div className="h-5 w-px bg-muted" />

      {/* 执行控制按钮 */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={handleStart}
          disabled={isStartDisabled}
          title="开始/继续执行"
        >
          <Play className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handlePause}
          disabled={isPauseDisabled}
          title="暂停执行"
        >
          <Pause className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleStep}
          disabled={isStepDisabled}
          title="单步执行"
        >
          <StepForward className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleStop}
          disabled={isStopDisabled}
          title="停止执行"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>

      {/* 分隔符 */}
      <div className="h-5 w-px bg-muted" />

      {/* 子树模拟按钮 - 隐藏，因为用户有真实后端 */}
      {false && (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSimulateSubtree}
            title="模拟子树执行"
          >
            <TreePine className="h-4 w-4" />
            <span className="ml-1">模拟</span>
          </Button>
        </div>
      )}

      {/* 错误信息显示 */}
      {debuggerConnectionError && (
        <div className="flex items-center text-destructive text-xs">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>{debuggerConnectionError}</span>
        </div>
      )}
    </div>
  );
}