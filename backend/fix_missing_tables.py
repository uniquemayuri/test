import os

# 文件路径
models_init_path = "app/models/__init__.py"

# 检查并创建 __init__.py 文件
if not os.path.exists(models_init_path):
    os.makedirs(os.path.dirname(models_init_path), exist_ok=True)
    with open(models_init_path, "w", encoding="utf-8") as f:
        f.write("# 初始化模型文件\n")
    print("✅ 已创建 app/models/__init__.py 文件")
else:
    print("✅ app/models/__init__.py 文件已存在")

# 读取当前内容
with open(models_init_path, "r", encoding="utf-8") as f:
    content = f.read()

# 需要添加的导入语句
imports_to_add = ["from .file import File", "from .user import User"]
added = []

# 检查并添加缺失的导入
with open(models_init_path, "a", encoding="utf-8") as f:
    for imp in imports_to_add:
        if imp not in content:
            f.write(f"{imp}\n")
            added.append(imp)

# 输出结果
if added:
    print("✅ 已添加以下导入语句到 __init__.py:")
    for imp in added:
        print(f"   - {imp}")
else:
    print("✅ 所有必要的导入语句已存在，无需修改")