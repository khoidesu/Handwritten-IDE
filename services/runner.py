from services.judge import run_python

def execute(code):
    result = run_python(code)

    return {
        "stdout": result["stdout"],
        "stderr": result["stderr"],
        "compile_output": result["compile_output"],
        "status": result["status"]["description"]
    }