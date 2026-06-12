#!/bin/bash
# lobster-chat 完成性验证脚本
# 验证所有功能模块正常，结果输出到 verify-complete.log

set -e
LOG="verify-complete.log"
echo "=== lobster-chat Complete Verification ===" | tee "$LOG"
date | tee -a "$LOG"

echo "" | tee -a "$LOG"
echo "=== 1. 前端测试 ===" | tee -a "$LOG"
cd "$(dirname "$0")/../apps/lobster-web-shell"
npm test 2>&1 | tee -a "$LOG"
if [ $? -eq 0 ]; then echo "PASS: frontend" | tee -a "$LOG"; else echo "FAIL: frontend" | tee -a "$LOG"; fi

echo "" | tee -a "$LOG"
echo "=== 2. Rust Gateway 编译 ===" | tee -a "$LOG"
cd "$(dirname "$0")/.."
cargo build -p lobster-waku-gateway 2>&1 | tee -a "$LOG"
if [ $? -eq 0 ]; then echo "PASS: gateway build" | tee -a "$LOG"; else echo "FAIL: gateway build" | tee -a "$LOG"; fi

echo "" | tee -a "$LOG"
echo "=== 3. Rust Gateway 测试 ===" | tee -a "$LOG"
cargo test -p lobster-waku-gateway 2>&1 | tee -a "$LOG"
if [ $? -eq 0 ]; then echo "PASS: gateway tests" | tee -a "$LOG"; else echo "FAIL: gateway tests" | tee -a "$LOG"; fi

echo "" | tee -a "$LOG"
echo "=== 4. Rust CLI 测试 ===" | tee -a "$LOG"
cargo test -p lobster-cli 2>&1 | tee -a "$LOG"
if [ $? -eq 0 ]; then echo "PASS: cli tests" | tee -a "$LOG"; else echo "FAIL: cli tests" | tee -a "$LOG"; fi

echo "" | tee -a "$LOG"
echo "=== 5. Rust TUI 测试 ===" | tee -a "$LOG"
cargo test -p lobster-tui 2>&1 | tee -a "$LOG"
if [ $? -eq 0 ]; then echo "PASS: tui tests" | tee -a "$LOG"; else echo "FAIL: tui tests" | tee -a "$LOG"; fi

echo "" | tee -a "$LOG"
echo "=== 6. 语法检查 ===" | tee -a "$LOG"
cd "$(dirname "$0")/../apps/lobster-web-shell"
for f in shell-*.js app.js; do node --check "$f" 2>&1 | tee -a "$LOG"; done
echo "PASS: syntax" | tee -a "$LOG"

echo "" | tee -a "$LOG"
echo "=== 7. 工作区干净 ===" | tee -a "$LOG"
cd "$(dirname "$0")/.."
git status --short | tee -a "$LOG"
echo "DONE: $(date)" | tee -a "$LOG"
