const express = require('express');
const mysql = require('mysql');
const path = require('path');
const static = require('serve-static');
const dbconfig = require('../config/dbconfig.json');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');

const pool = mysql.createPool({
    connectionLimit:10,
    host:dbconfig.host,
    user:dbconfig.user,
    password:dbconfig.password,
    database:dbconfig.database,
    debug: false
});

const app = express();
app.use(express.urlencoded({extended:true}));
app.use(express.json());

//원래는 public안에 모든 폴더들이 있어야하는데 내가 html만 따로 넣어놔서
//다른 예제들과 다르게 경로를 다 설정해줘야하는 경우가 생긴 것이다.
app.use('/public', static(path.join(__dirname, '../public')));
app.use('/css', express.static(__dirname + '/../css', {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));
app.use('/js', express.static(__dirname, {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'text/javascript');
        }
    }
}));

// Multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // 파일이 업로드되는 경로
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); // 업로드된 파일의 이름
    },
});

const upload = multer({ storage });

//이미지를 db에 저장하기
app.post('/saveImgAtDb', upload.single('img'), (req, res) => {
console.log('saveImgAtDb req');

pool.getConnection((err, conn) => {
    if (err) {
        console.error(err);
        res.json({ success: false });
        return;
    }

    //id를 데이터 length를 통해 계산한다.
    let id = -1;
    let query_str = 'select * from dbex.dbex';
    conn.query(query_str, function (err, results, fields) {
        if (err) {
            console.error(err);
            conn.release();
            res.json({ success: false });
            return;
        }

        id = results.length + 1;

        if (id <= 0) {
                console.error('invalid id:', id);
                conn.release();
                res.json({ success: false });
                return;
        }
        //FormData 객체에서 이미지 데이터 가져오기
        let imageData = fs.readFileSync(req.file.path);
        //데이터를 DB에 넣는다.
        query_str = 'INSERT INTO dbex.dbex (id, img) VALUES (?, ?)';
        const query_var = [id, imageData];

        conn.query(query_str, query_var, (err, results) => {
            if (err) {
                console.error(err);
                conn.release();
                res.json({ success: false });
                return;
            }
            console.log('Data inserted into DB');
            
            //입력된 데이터를 다시 뽑아서 res 해준다.
            query_str = 'select * from dbex.dbex where id = ?';
            pool.query(query_str, [id], (err, rows, fields) => {
                if (err) {
                    console.error(err);
                    conn.release();
                    res.json({ success: false });
                    return;
                }
                console.log(rows);

                conn.release();
                res.status(200).json({ success: true, 'result': rows });
                });
            });
        });
    });
});

//db에서 이미지를 로드하기
app.post('/roadImgAtDb', (req, res) => {
console.log('roadImgAtDb req');

pool.getConnection((err, conn) => {
    if (err) {
        console.error(err);
        conn.release();
        res.json({ success: false });
        return;
    }

    const query_str = 'select * from dbex.dbex';
    
    conn.query(query_str, (error, rows, fields) => {
        if (error) {
            console.error(err);
            conn.release();
            res.status(401).json({ success: false });
            return;
        }

        const reply = {
            'result' : rows
        }
        res.status(200).json(reply);
        conn.release();
        });
    });
});

app.listen(3000, () => {
    console.log('server started at 3000');
});