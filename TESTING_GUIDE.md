# 🧪 BT Web Studio 测试指南

## 📋 问题诊断结果

通过增强的日志记录，我们确认了协议连接问题的根本原因：

### 🔍 **核心问题**
1. **后端没有加载行为树** - `getTree`返回空XML（0字符）
2. **协议状态错误** - 当没有树加载时，`getStatus`和`getBlackboard`请求会失败
3. **错误信息**: `"Operation cannot be accomplished in current state"`

### 📊 **日志分析**
```
🌳 Sending getTree request with ID: 1
⚠️  Empty XML received - backend may not have a tree loaded
📊 Sending getStatus request with ID: 2  
❌ getStatus failed: Operation cannot be accomplished in current state
📋 Sending getBlackboard request with ID: 3
❌ getBlackboard failed: Operation cannot be accomplished in current state
```

## 🛠️ **解决方案和测试方法**

### **方案1: 使用模拟后端测试**

#### 1. 启动模拟后端
```bash
# 在第一个终端窗口
cd /home/zwhy/workspace/bt-web-studio
python tools/test_bt_backend.py
```

#### 2. 启动Web应用
```bash
# 在第二个终端窗口  
cd /home/zwhy/workspace/bt-web-studio
./tools/run.sh
```

#### 3. 验证连接
- 打开浏览器访问 `http://localhost:5173`
- 检查浏览器控制台，应该看到：
  ```
  🌳 Tree data received: 200+ characters
  ✅ Tree loaded successfully from backend
  📊 Status update received
  📋 Blackboard update received
  ```

### **方案2: 直接协议测试**

#### 测试当前后端状态
```bash
cd /home/zwhy/workspace/bt-web-studio
python tools/test_protocol.py 192.168.31.235 1667
```

#### 测试模拟后端
```bash
# 启动模拟后端后
python tools/test_protocol.py localhost 1667
```

### **方案3: 修复真实后端**

如果你有真实的BehaviorTree.CPP应用程序，确保：

1. **加载行为树XML文件**
   ```cpp
   // 在C++代码中
   BT::BehaviorTreeFactory factory;
   auto tree = factory.createTreeFromFile("your_tree.xml");
   
   // 创建Groot2发布器
   BT::Groot2Publisher publisher(tree);
   ```

2. **启动树执行**
   ```cpp
   // 开始执行行为树
   tree.tickRoot();
   ```

## 🔧 **代码修复说明**

### **已修复的问题**
1. ✅ **增强日志记录** - 添加了详细的emoji日志，便于调试
2. ✅ **错误处理改进** - 更好的协议错误检测和用户反馈
3. ✅ **状态检查** - 在请求status/blackboard前验证树是否已加载
4. ✅ **前端重复case** - 修复了TypeScript编译错误

### **新增功能**
1. 🆕 **智能请求顺序** - 先获取树，确认加载后再请求状态
2. 🆕 **协议状态检测** - 识别"Operation cannot be accomplished"错误
3. 🆕 **模拟后端** - 用于测试的完整后端实现
4. 🆕 **协议测试工具** - 直接测试ZMQ连接的工具

## 📈 **测试检查清单**

### ✅ **基本连接测试**
- [ ] WebSocket连接成功 (`ws://localhost:8080`)
- [ ] ZMQ连接成功 (`tcp://192.168.31.235:1667`)
- [ ] 协议握手正常

### ✅ **数据交换测试**
- [ ] getTree请求成功
- [ ] 接收到非空XML数据
- [ ] getStatus请求成功（树加载后）
- [ ] getBlackboard请求成功（树加载后）

### ✅ **错误处理测试**
- [ ] 空树状态正确检测
- [ ] 协议错误正确显示
- [ ] 连接断开正确处理

### ✅ **前端功能测试**
- [ ] 行为树可视化正常
- [ ] 节点状态更新正常
- [ ] 黑板数据显示正常
- [ ] 调试面板功能正常

## 🚀 **快速测试命令**

```bash
# 1. 启动模拟后端（推荐用于测试）
python tools/test_bt_backend.py

# 2. 启动Web应用
./tools/run.sh

# 3. 测试协议连接
python tools/test_protocol.py localhost 1667

# 4. 查看详细日志
tail -f proxy_debug.log
```

## 🔍 **故障排除**

### **常见问题**

1. **"Empty tree XML"**
   - 原因：后端没有加载行为树
   - 解决：使用模拟后端或确保真实后端已加载树

2. **"Operation cannot be accomplished in current state"**
   - 原因：在树未加载时请求状态/黑板
   - 解决：已修复 - 现在会先确认树加载

3. **"WebSocket connection failed"**
   - 原因：代理服务器未启动
   - 解决：检查`./tools/run.sh`是否正常启动

4. **"ZMQ connection timeout"**
   - 原因：后端服务器不可达
   - 解决：检查IP地址和端口配置

### **调试技巧**

1. **查看实时日志**
   ```bash
   tail -f proxy_debug.log
   ```

2. **检查网络连接**
   ```bash
   telnet 192.168.31.235 1667
   ```

3. **验证端口占用**
   ```bash
   netstat -tlnp | grep -E "(1667|1668|8080|5173)"
   ```

## 📝 **下一步开发建议**

1. **添加树编辑器集成** - 允许在Web界面中创建和编辑行为树
2. **实时状态可视化** - 在节点上显示执行状态
3. **断点调试功能** - 实现真正的调试器功能
4. **性能监控** - 添加执行时间和性能指标
5. **云端存储** - 支持行为树的云端保存和分享
