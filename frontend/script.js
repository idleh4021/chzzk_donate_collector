function handleGreet() {
    const name = document.getElementById('nameInput').value;
    const responseEl = document.getElementById('response');

    if (!name) {
        alert("이름을 입력해주세요!");
        return;
    }

    // backend/api.py의 greet 함수 호출
    window.pywebview.api.greet(name).then(res => {
        responseEl.innerText = res;
    });
}