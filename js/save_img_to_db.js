//서버는 svr.js만 실행할 것이기 때문에 여기서 node.js 코드는 모두 지우고
//send / receive를 통해 svr.js를 통해 모든 것을 통제해야한다.
const imageContatiner = document.querySelector('.list');
const prevButton = document.querySelector('.prev-btn');
const nextButton = document.querySelector('.next-btn');

var input = document.getElementById('input');
const inputBtn = document.getElementById('input-btn');

inputBtn.addEventListener('click', doInput);

var images = [];
const itemsPerPage = 5; //한 페이지에 표시할 이미지 수
let currentPage = 1; //현재 페이지

function doInput() {
    const file = input.files[0];
    //이미지가 선택되지 않았을 때
    if (file == undefined || !file.type.startsWith('image/'))
    {
        console.log('파일이 선택되지 않았거나 이미지가 아닙니다.');
        return;
    }
    const reader = new FileReader();

    reader.addEventListener('load', (event) => {
        //파일을 읽는 작업이 완료된 후 실행될 코드
        //const result = event.target.result;
        //파일 데이터를 FormData 객체에 추가
        const formData = new FormData();
        formData.append('img', file);
        //파일 데이터를 Blob 형식으로 변환
        //const blob = new Blob([result], { type: 'image/jpeg' });
        
        //서버에 데이터를 전송
        fetch('/saveImgAtDb', {
            method: 'post',
            body: formData,
            responseType: 'blob',
        })
        .then(res => {
            if (res.ok) {
                return res.json();
            }

            throw new Error('Network res was not ok.');
        })
        .then(async (res) => {
            if (!res.success)
            {
                console.log('res.success: false');
                return;
            }

            const binary = new Uint8Array(res['result'][0]['img']['data']);
            const blob = new Blob([binary], {type:'image/jpeg'});
            
            const kimg = new Image();
            kimg.src = URL.createObjectURL(blob);

            const imgLoadingDone = await kimg.decode();
            // const blob = new Blob([blobData], { type: 'image/png' }); // Blob 생성
            // const imageURL = URL.createObjectURL(blob); // Blob URL 생성
            // console.log('50' + imageURL);

            // const image = new Image(); // 새로운 이미지 생성
            // image.src = imageURL; // Blob URL을 이미지의 src 속성에 전달

            // await new Promise((resolve) => { // 이미지 로딩을 기다리는 Promise 생성
            //     image.onload = resolve;
            // });

            images.push(kimg); // 이미지 배열에 새로운 이미지 추가
            console.log(kimg);

            //데이터에 저장됬던 이미지가 다시 제대로 돌아왔으니
            //페이징 새로고침
            //이미지 수가 페이징 수 보다 적을 때
            if (images.length < itemsPerPage)
            {
                //추가 후 페이지 표시 - 이미지 갯수가 표시할 개수보다 적을 때
                renderImages(images, imageContatiner, 0, images.length);
            }
            else
            {
                //추가 후 페이지 표시
                renderImages(images, imageContatiner, (currentPage - 1) * itemsPerPage , itemsPerPage);
            }

            //이전, 다음 버튼과 페이지 번호를 표시합니다.
            renderPagination(Math.ceil(images.length / itemsPerPage));
        })
        .catch(error => {
            console.error(error);
        });
    });
    //파일을 읽어서 result를 ArrayBuffer 형태로 얻게 해준다.
    //이 작업이 끝나면 load 이벤트가 발생한다.
    reader.readAsArrayBuffer(file);
}

fetch('/roadImgAtDb', {
    method:'post',
    headers: {
        'content-type':'application/json'
    }
}).then((res) => res.json())
.then(async (res) => {
    //[0] -> result가 들고온 rows들에서 첫번째
    //rows[0] -> [id/img]
    //[img] -> 필요한 이미지를 뽑도록 
    //[data] -> img의 실제 바어너리 데이터

    for (let result of res['result']) {
        //픽셀 데이터는 0~255의 값으로 이루어진 unsigned int
        //한 픽셀 당 1 byte
        //base64 decode -> blob -> image 형태로 변환
        const binary = new Uint8Array(result['img']['data']);
        const blob = new Blob([binary], {type:'image/jpeg'});
 
        const kimg = new Image();
        //blob을 image로 로딩 시키는 함수
        kimg.src = URL.createObjectURL(blob);

        const imgLoadingDone = await kimg.decode();

        images.push(kimg);

        console.log(kimg);
    }

    //이미지 수가 페이징 수 보다 적을 때
    if (images.length < itemsPerPage)
    {
        //첫 페이지 이미지 표시
        renderImages(images, imageContatiner, 0, images.length);
    }
    else
    {
        //첫 페이지 이미지 표시
        renderImages(images, imageContatiner, 0, itemsPerPage);
    }
    //이전, 다음 버튼과 페이지 번호를 표시합니다.
    renderPagination(Math.ceil(images.length / itemsPerPage));
});

//이미지 요소를 생성하여 contatiner에 추가하는 함수
function renderImages(images, container, startIndex, endIndex) {
    //이전 페이지에 표시된 이미지 요소 삭제
    container.innerHTML = '';

    //startIndex부터 endIndex까지의 이미지 요소 생성
    for (let i = startIndex; i < endIndex; i++) {
        if (!images[i])
        {
            console.log('i : ' + i);
            continue;
        }

        const imageElement = document.createElement('img');
        imageElement.onload = function() {
            container.appendChild(imageElement);
        }
        imageElement.src = images[i].src;
    }
}

function renderPagination(totalPages) {
    const paginationContainer = document.querySelector('.pagination');
    const pageNumbersContainer = paginationContainer.querySelector('.page-num');

    // 현재 페이지 번호와 총 페이지 수를 보여줍니다.
    pageNumbersContainer.innerHTML = `${currentPage} / ${totalPages}`;

    // 이전 버튼과 다음 버튼을 만듭니다.
    const prevButton = document.createElement('button');
    prevButton.textContent = '< 이전';
    prevButton.classList.add('prev-btn');
    prevButton.addEventListener('click', goToPrevPage);

    const nextButton = document.createElement('button');
    nextButton.textContent = '다음 >';
    nextButton.classList.add('next-btn');
    nextButton.addEventListener('click', goToNextPage);

    // 현재 페이지가 첫 번째 페이지이면 이전 버튼을 비활성화합니다.
    if (currentPage === 1) {
        prevButton.disabled = true;
    }

    // 현재 페이지가 마지막 페이지이면 다음 버튼을 비활성화합니다.
    if (currentPage === totalPages) {
        nextButton.disabled = true;
    }

    // 페이지 번호와 버튼을 컨테이너에 추가합니다.
    paginationContainer.innerHTML = '';
    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageNumbersContainer);
    paginationContainer.appendChild(nextButton);
}

//이전 페이지로 이동하는 함수
function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        renderImages(images, imageContatiner, startIndex, endIndex);
        renderPagination(Math.ceil(images.length / itemsPerPage));
    }
}

//다음 페이지로 이동하는 함수
function goToNextPage() {
    const totalPages = Math.ceil(images.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        renderImages(images, imageContatiner, startIndex, endIndex);
        renderPagination(totalPages);
    }
}