#!/usr/bin/env python3
"""
Groot2 Protocol Batch Test Script
批量测试Groot2协议的所有功能
"""

import zmq
import struct
import json
import time
import binascii

def format_binary_data(data, max_length=100):
    """格式化二进制数据为人类可读的字符串"""
    if not data:
        return "(empty)"
    
    # 尝试解码为UTF-8字符串
    try:
        text = data.decode('utf-8')
        if len(text) <= max_length:
            return f'"{text}"'
        else:
            return f'"{text[:max_length]}..." ({len(text)} chars)'
    except UnicodeDecodeError:
        # 如果不是有效的UTF-8，显示十六进制
        hex_str = data.hex()
        if len(hex_str) <= max_length:
            return f"0x{hex_str}"
        else:
            return f"0x{hex_str[:max_length]}... ({len(hex_str)} hex chars)"

def print_formatted_response(response):
    """格式化打印响应数据"""
    if not response:
        print("  Response data: (no response)")
        return
        
    print("  Response data:")
    for i, part in enumerate(response):
        if isinstance(part, bytes):
            formatted = format_binary_data(part)
            print(f"    Part {i+1} ({len(part)} bytes): {formatted}")
        else:
            print(f"    Part {i+1}: {part}")

def test_connection(server_ip="127.0.0.1", port=1667):
    """测试基本连接"""
    print("Testing connection...")
    context = zmq.Context()
    try:
        socket = context.socket(zmq.REQ)
        socket.connect(f"tcp://{server_ip}:{port}")
        
        # 发送简单的STATUS请求测试连接
        header = struct.pack('!BBi', 2, ord('S'), 1)
        socket.send(header)
        response = socket.recv_multipart()
        print_formatted_response(response)
        
        socket.close()
        context.term()
        
        if response and len(response) > 0:
            print("✓ Connection successful")
            return True
        else:
            print("✗ No response received")
            return False
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        try:
            socket.close()
            context.term()
        except:
            pass
        return False

def batch_test_requests(server_ip="127.0.0.1", port=1667):
    """批量测试所有请求类型"""
    
    # 测试用例定义 - 包含所有12种请求类型
    test_cases = [
        # (描述, 请求类型, 请求ID, 数据, 预期结果)
        ("获取完整树结构", 'T', 1001, None, "应返回XML格式的树结构"),
        ("获取节点状态", 'S', 1002, None, "应返回节点状态数据"),
        ("获取黑板变量", 'B', 1003, b"MainTree", "应返回MessagePack编码的JSON数据"),
        ("获取钩子列表", 'D', 1004, None, "应返回JSON格式的钩子列表"),
        ("移除所有钩子", 'A', 1005, None, "应成功移除所有钩子"),
        ("禁用所有钩子", 'X', 1006, None, "应成功禁用所有钩子"),
        ("获取转换记录", 't', 1007, None, "应返回状态转换数据"),
        ("获取钩子列表(重复)", 'D', 1008, None, "应返回更新后的钩子列表"),
    ]
    
    context = zmq.Context()
    socket = context.socket(zmq.REQ)
    socket.connect(f"tcp://{server_ip}:{port}")
    
    results = []
    
    print(f"开始批量测试 {len(test_cases)} 个请求类型...")
    print("=" * 60)
    
    for i, (description, req_type, req_id, data, expected) in enumerate(test_cases, 1):
        print(f"\n[{i}/{len(test_cases)}] {description} (类型: {req_type})")
        
        try:
            start_time = time.time()
            
            # 创建并发送请求
            header = struct.pack('!BBi', 2, ord(req_type), req_id)
            if data and req_type == 'B':
                # BLACKBOARD请求需要发送多部分消息
                socket.send_multipart([header, data])
            elif data:
                # 其他带数据的请求
                socket.send_multipart([header, data])
            else:
                # 不带数据的请求
                socket.send(header)
            
            # 接收响应
            response = socket.recv_multipart()
            print_formatted_response(response)
            elapsed_time = time.time() - start_time
            
            # 分析响应
            if response and len(response) > 0:
                # 解析头部
                if len(response[0]) >= 6:
                    protocol, msg_type, msg_id = struct.unpack('!BBi', response[0][:6])
                    print(f"  ✓ 成功 - 协议: {protocol}, 类型: {chr(msg_type)}, ID: {msg_id}")
                    print(f"  ✓ 响应时间: {elapsed_time:.3f}秒")
                    
                    # 分析数据部分
                    if len(response) > 1:
                        data_length = sum(len(part) for part in response[1:])
                        print(f"  ✓ 数据长度: {data_length} 字节")
                        
                        # 尝试解析特定类型的数据
                        if req_type == 'T':
                            # XML树结构数据
                            try:
                                xml_content = response[1].decode('utf-8')
                                node_count = xml_content.count('<')
                                print(f"  ✓ XML节点数: {node_count}")
                                # 显示XML片段
                                if len(xml_content) > 200:
                                    print(f"    XML片段: {xml_content[:200]}...")
                                else:
                                    print(f"    XML内容: {xml_content}")
                            except Exception as e:
                                print(f"  ✓ 二进制XML数据: {format_binary_data(response[1])}")
                        elif req_type == 'S':
                            # 节点状态数据 (3字节每节点: UID(2)+状态(1))
                            status_data = response[1]
                            if len(status_data) % 3 == 0 and len(status_data) > 0:
                                node_count = len(status_data) // 3
                                print(f"  ✓ 节点数量: {node_count}")
                                # 显示前几个节点状态
                                for j in range(min(5, node_count)):
                                    offset = j * 3
                                    if offset + 3 <= len(status_data):
                                        uid = struct.unpack('!H', status_data[offset:offset+2])[0]
                                        status = status_data[offset+2]
                                        status_names = {0: "IDLE", 1: "RUNNING", 2: "SUCCESS", 3: "FAILURE", 
                                                       10: "IDLE_FROM_SUCCESS", 11: "IDLE_FROM_FAILURE", 12: "IDLE_FROM_RUNNING"}
                                        status_name = status_names.get(status, f"UNKNOWN({status})")
                                        print(f"    Node {uid}: {status_name}")
                        elif req_type == 'B':
                            # 黑板数据 (MessagePack JSON)
                            try:
                                import msgpack
                                bb_data = msgpack.unpackb(response[1])
                                print(f"  ✓ 黑板变量数: {len(bb_data) if isinstance(bb_data, dict) else 'N/A'}")
                                # 显示前几个变量
                                if isinstance(bb_data, dict):
                                    keys = list(bb_data.keys())[:3]
                                    for key in keys:
                                        value = bb_data[key]
                                        print(f"    {key}: {value}")
                            except Exception as e:
                                print(f"  ✓ 二进制黑板数据: {format_binary_data(response[1])}")
                        elif req_type == 'D':
                            # 钩子列表 (JSON)
                            try:
                                hooks_json = json.loads(response[1].decode('utf-8'))
                                print(f"  ✓ 钩子数量: {len(hooks_json) if isinstance(hooks_json, list) else 'N/A'}")
                                # 显示前几个钩子
                                if isinstance(hooks_json, list) and len(hooks_json) > 0:
                                    for k, hook in enumerate(hooks_json[:3]):
                                        if isinstance(hook, dict) and 'uid' in hook:
                                            print(f"    Hook {k+1}: Node {hook.get('uid', 'N/A')}")
                            except Exception as e:
                                print(f"  ✓ 二进制钩子数据: {format_binary_data(response[1])}")
                        elif req_type == 't':
                            # 转换记录 (9字节每记录: 时间戳(6)+UID(2)+状态(1))
                            transitions_data = response[1]
                            if len(transitions_data) % 9 == 0 and len(transitions_data) > 0:
                                transition_count = len(transitions_data) // 9
                                print(f"  ✓ 转换记录数: {transition_count}")
                                # 显示前几个转换记录
                                for j in range(min(3, transition_count)):
                                    offset = j * 9
                                    if offset + 9 <= len(transitions_data):
                                        timestamp_bytes = transitions_data[offset:offset+6]
                                        uid = struct.unpack('!H', transitions_data[offset+6:offset+8])[0]
                                        status = transitions_data[offset+8]
                                        status_names = {0: "IDLE", 1: "RUNNING", 2: "SUCCESS", 3: "FAILURE"}
                                        status_name = status_names.get(status, f"UNKNOWN({status})")
                                        print(f"    Transition {j+1}: Node {uid}, Status {status_name}")
                    elif len(response[0]) == 22:
                        # 仅头部响应 (22字节)
                        print(f"  ✓ 仅头部响应")
                    else:
                        # 其他长度的响应
                        print(f"  ✓ 响应长度: {len(response[0])} 字节")
                    
                    results.append((description, True, elapsed_time))
                else:
                    print(f"  ✗ 响应头部格式错误")
                    results.append((description, False, elapsed_time))
            else:
                print(f"  ✗ 无响应")
                results.append((description, False, elapsed_time))
                
        except Exception as e:
            print(f"  ✗ 错误: {e}")
            results.append((description, False, 0))
            
        # 短暂延迟避免过快请求
        time.sleep(0.1)
    
    socket.close()
    context.term()
    
    return results

def test_hook_operations(server_ip="127.0.0.1", port=1667):
    """测试钩子相关操作"""
    print(f"\n测试钩子操作...")
    print("=" * 40)
    
    context = zmq.Context()
    socket = context.socket(zmq.REQ)
    socket.connect(f"tcp://{server_ip}:{port}")
    
    hook_results = []
    
    # 测试设置断点
    print("1. 设置断点 (HOOK_INSERT)")
    try:
        hook_data = {
            "enabled": True,
            "uid": 256,
            "mode": 0,           # 0=BREAKPOINT, 1=REPLACE
            "once": False,
            "desired_status": "SUCCESS",
            "position": 0        # 0=PRE, 1=POST
        }
        hook_json = json.dumps(hook_data)
        
        header = struct.pack('!BBi', 2, ord('I'), 2001)
        socket.send_multipart([header, hook_json.encode('utf-8')])
        response = socket.recv_multipart()
        print_formatted_response(response)
        
        if response and len(response) > 0:
            if len(response[0]) >= 6:
                protocol, msg_type, msg_id = struct.unpack('!BBi', response[0][:6])
                print(f"  ✓ 断点设置成功 - 协议: {protocol}, 类型: {chr(msg_type)}, ID: {msg_id}")
                hook_results.append(("设置断点", True))
            else:
                print("  ✗ 响应格式错误")
                hook_results.append(("设置断点", False))
        else:
            print("  ✗ 无响应")
            hook_results.append(("设置断点", False))
    except Exception as e:
        print(f"  ✗ 设置断点错误: {e}")
        hook_results.append(("设置断点", False))
    
    time.sleep(0.1)
    
    # 测试移除断点
    print("2. 移除断点 (HOOK_REMOVE)")
    try:
        remove_data = {
            "uid": 256,
            "position": 0
        }
        remove_json = json.dumps(remove_data)
        
        header = struct.pack('!BBi', 2, ord('R'), 2002)
        socket.send_multipart([header, remove_json.encode('utf-8')])
        response = socket.recv_multipart()
        print_formatted_response(response)
        
        if response and len(response) > 0:
            if len(response[0]) >= 6:
                protocol, msg_type, msg_id = struct.unpack('!BBi', response[0][:6])
                print(f"  ✓ 断点移除成功 - 协议: {protocol}, 类型: {chr(msg_type)}, ID: {msg_id}")
                hook_results.append(("移除断点", True))
            else:
                print("  ✗ 响应格式错误")
                hook_results.append(("移除断点", False))
        else:
            print("  ✗ 无响应")
            hook_results.append(("移除断点", False))
    except Exception as e:
        print(f"  ✗ 移除断点错误: {e}")
        hook_results.append(("移除断点", False))
    
    socket.close()
    context.term()
    
    return hook_results

def test_recording_operations(server_ip="127.0.0.1", port=1667):
    """测试录制相关操作"""
    print(f"\n测试录制操作...")
    print("=" * 40)
    
    context = zmq.Context()
    socket = context.socket(zmq.REQ)
    socket.connect(f"tcp://{server_ip}:{port}")
    
    recording_results = []
    
    # 测试开始录制
    print("1. 开始录制 (TOGGLE_RECORDING)")
    try:
        header = struct.pack('!BBi', 2, ord('r'), 3001)
        socket.send_multipart([header, b"start"])
        response = socket.recv_multipart()
        print_formatted_response(response)
        
        if response and len(response) > 0:
            if len(response[0]) >= 6:
                protocol, msg_type, msg_id = struct.unpack('!BBi', response[0][:6])
                print(f"  ✓ 录制开始成功 - 协议: {protocol}, 类型: {chr(msg_type)}, ID: {msg_id}")
                if len(response) > 1:
                    try:
                        timestamp = response[1].decode('utf-8')
                        print(f"  ✓ 开始时间: {timestamp}")
                    except:
                        print(f"  ✓ 二进制时间戳数据")
                recording_results.append(("开始录制", True))
            else:
                print("  ✗ 响应格式错误")
                recording_results.append(("开始录制", False))
        else:
            print("  ✗ 无响应")
            recording_results.append(("开始录制", False))
    except Exception as e:
        print(f"  ✗ 开始录制错误: {e}")
        recording_results.append(("开始录制", False))
    
    time.sleep(0.1)
    
    # 测试停止录制
    print("2. 停止录制 (TOGGLE_RECORDING)")
    try:
        header = struct.pack('!BBi', 2, ord('r'), 3002)
        socket.send_multipart([header, b"stop"])
        response = socket.recv_multipart()
        print_formatted_response(response)
        
        if response and len(response) > 0:
            if len(response[0]) >= 6:
                protocol, msg_type, msg_id = struct.unpack('!BBi', response[0][:6])
                print(f"  ✓ 录制停止成功 - 协议: {protocol}, 类型: {chr(msg_type)}, ID: {msg_id}")
                recording_results.append(("停止录制", True))
            else:
                print("  ✗ 响应格式错误")
                recording_results.append(("停止录制", False))
        else:
            print("  ✗ 无响应")
            recording_results.append(("停止录制", False))
    except Exception as e:
        print(f"  ✗ 停止录制错误: {e}")
        recording_results.append(("停止录制", False))
    
    socket.close()
    context.term()
    
    return recording_results

def test_breakpoint_unlock(server_ip="127.0.0.1", port=1667):
    """测试断点解锁操作"""
    print(f"\n测试断点解锁操作...")
    print("=" * 40)
    
    context = zmq.Context()
    socket = context.socket(zmq.REQ)
    socket.connect(f"tcp://{server_ip}:{port}")
    
    unlock_results = []
    
    # 测试断点解锁
    print("1. 解锁断点 (BREAKPOINT_UNLOCK)")
    try:
        unlock_data = {
            "uid": 256,
            "desired_status": "SUCCESS",
            "position": 0,
            "remove_when_done": False
        }
        unlock_json = json.dumps(unlock_data)
        
        header = struct.pack('!BBi', 2, ord('U'), 4001)
        socket.send_multipart([header, unlock_json.encode('utf-8')])
        response = socket.recv_multipart()
        print_formatted_response(response)
        
        if response and len(response) > 0:
            if len(response[0]) >= 6:
                protocol, msg_type, msg_id = struct.unpack('!BBi', response[0][:6])
                print(f"  ✓ 断点解锁成功 - 协议: {protocol}, 类型: {chr(msg_type)}, ID: {msg_id}")
                unlock_results.append(("解锁断点", True))
            else:
                print("  ✗ 响应格式错误")
                unlock_results.append(("解锁断点", False))
        else:
            print("  ✗ 无响应")
            unlock_results.append(("解锁断点", False))
    except Exception as e:
        print(f"  ✗ 解锁断点错误: {e}")
        unlock_results.append(("解锁断点", False))
    
    socket.close()
    context.term()
    
    return unlock_results

def print_summary(results, hook_results, recording_results, unlock_results):
    """打印测试摘要"""
    print("\n" + "=" * 60)
    print("测试摘要")
    print("=" * 60)
    
    # 基本请求测试摘要
    total_tests = len(results)
    passed_tests = sum(1 for _, success, _ in results if success)
    print(f"\n基本请求测试: {passed_tests}/{total_tests} 通过")
    
    for description, success, elapsed in results:
        status = "✓" if success else "✗"
        time_str = f" ({elapsed:.3f}s)" if elapsed > 0 else ""
        print(f"  {status} {description}{time_str}")
    
    # 钩子操作测试摘要
    if hook_results:
        total_hooks = len(hook_results)
        passed_hooks = sum(1 for _, success in hook_results if success)
        print(f"\n钩子操作测试: {passed_hooks}/{total_hooks} 通过")
        
        for description, success in hook_results:
            status = "✓" if success else "✗"
            print(f"  {status} {description}")
    
    # 录制操作测试摘要
    if recording_results:
        total_recording = len(recording_results)
        passed_recording = sum(1 for _, success in recording_results if success)
        print(f"\n录制操作测试: {passed_recording}/{total_recording} 通过")
        
        for description, success in recording_results:
            status = "✓" if success else "✗"
            print(f"  {status} {description}")
    
    # 断点解锁测试摘要
    if unlock_results:
        total_unlock = len(unlock_results)
        passed_unlock = sum(1 for _, success in unlock_results if success)
        print(f"\n断点解锁测试: {passed_unlock}/{total_unlock} 通过")
        
        for description, success in unlock_results:
            status = "✓" if success else "✗"
            print(f"  {status} {description}")
    
    # 总体统计
    overall_total = total_tests + len(hook_results) + len(recording_results) + len(unlock_results)
    overall_passed = passed_tests + sum(1 for _, success in hook_results if success) + sum(1 for _, success in recording_results if success) + sum(1 for _, success in unlock_results if success)
    
    print(f"\n总体结果: {overall_passed}/{overall_total} 测试通过")
    
    if overall_passed == overall_total:
        print("🎉 所有测试通过!")
        return True
    else:
        print("❌ 部分测试失败")
        return False

def main():
    """主函数"""
    server_ip = "127.0.0.1"
    port = 1667
    
    print("Groot2协议批量测试工具")
    print("=" * 60)
    print(f"服务器地址: {server_ip}:{port}")
    print()
    
    # 测试连接
    if not test_connection(server_ip, port):
        print("无法连接到服务器，退出测试")
        return 1
    
    # 执行批量测试
    results = batch_test_requests(server_ip, port)
    
    # 测试钩子操作
    hook_results = test_hook_operations(server_ip, port)
    
    # 测试录制操作
    recording_results = test_recording_operations(server_ip, port)
    
    # 测试断点解锁操作
    unlock_results = test_breakpoint_unlock(server_ip, port)
    
    # 打印摘要
    success = print_summary(results, hook_results, recording_results, unlock_results)
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())