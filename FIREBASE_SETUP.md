# Firebase 설정 가이드

이 프로젝트는 Firebase Firestore를 사용하여 사용자들의 분석 데이터를 저장하고 비교합니다.

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속합니다.
2. "프로젝트 추가" 버튼을 클릭합니다.
3. 프로젝트 이름을 입력하고 생성합니다.

## 2. Firestore Database 활성화

1. 왼쪽 메뉴에서 "Firestore Database"를 선택합니다.
2. "데이터베이스 만들기" 버튼을 클릭합니다.
3. **테스트 모드로 시작**을 선택합니다 (나중에 보안 규칙을 수정할 수 있습니다).
4. 위치를 선택하고 (예: asia-northeast3 - Seoul) "사용 설정"을 클릭합니다.

## 3. 웹 앱 추가 및 설정 정보 가져오기

1. Firebase Console의 프로젝트 개요 페이지로 이동합니다.
2. "앱 추가" 버튼을 클릭하고 웹 아이콘(</>)을 선택합니다.
3. 앱 닉네임을 입력합니다 (예: "ChatGPT Log Analyzer").
4. "앱 등록" 버튼을 클릭합니다.
5. Firebase SDK 구성 정보가 표시됩니다. 아래와 같은 형식입니다:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## 4. 프로젝트에 Firebase 설정 적용

1. `src/firebase.js` 파일을 엽니다.
2. `firebaseConfig` 객체를 Firebase Console에서 복사한 설정으로 교체합니다:

```javascript
// src/firebase.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",           // 여기를 복사한 값으로 교체
  authDomain: "YOUR_AUTH_DOMAIN",   // 여기를 복사한 값으로 교체
  projectId: "YOUR_PROJECT_ID",     // 여기를 복사한 값으로 교체
  storageBucket: "YOUR_STORAGE_BUCKET",  // 여기를 복사한 값으로 교체
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",  // 여기를 복사한 값으로 교체
  appId: "YOUR_APP_ID"              // 여기를 복사한 값으로 교체
};
```

3. 파일을 저장합니다.

## 5. 보안 규칙 설정 (선택사항)

프로덕션 환경에서는 보안 규칙을 설정하는 것이 좋습니다.

1. Firebase Console의 Firestore Database로 이동합니다.
2. "규칙" 탭을 클릭합니다.
3. 아래 규칙을 적용합니다:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // analysisResults 컬렉션은 누구나 읽고 쓸 수 있음
    match /analysisResults/{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

**주의**: 위 규칙은 데모 목적으로 누구나 읽고 쓸 수 있도록 설정되어 있습니다. 실제 프로덕션에서는 인증 시스템을 구현하는 것을 권장합니다.

## 6. 테스트

1. 개발 서버를 실행합니다:
```bash
npm run dev
```

2. 브라우저에서 애플리케이션을 열고 ChatGPT 로그를 분석합니다.
3. 분석이 완료되면 "Upload & Compare My Scores" 버튼을 클릭합니다.
4. 데이터가 성공적으로 업로드되고 비교 페이지로 이동하면 설정이 완료된 것입니다!

## 문제 해결

### "업로드에 실패했습니다" 오류가 발생하는 경우

1. `src/firebase.js` 파일의 설정이 올바른지 확인합니다.
2. Firebase Console에서 Firestore Database가 활성화되어 있는지 확인합니다.
3. 브라우저 콘솔(F12)에서 자세한 에러 메시지를 확인합니다.

### "Permission denied" 오류가 발생하는 경우

Firestore 보안 규칙을 확인하고 위의 5단계를 참고하여 규칙을 업데이트합니다.

## 데이터 구조

업로드되는 데이터는 다음과 같은 구조를 가집니다:

```javascript
{
  avgHallucinationScore: 2.3,
  avgOverRelianceScore: 3.5,
  totalFiles: 5,
  totalTurns: 47,
  mostCommonPurpose: "Information Seeking",
  purposeDistribution: { ... },
  sessions: [ ... ],
  uploadedAt: Timestamp
}
```

**중요**: 대화 내용은 업로드되지 않으며, 점수와 통계 데이터만 저장됩니다.

## 참고 자료

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firestore 시작하기](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase 보안 규칙](https://firebase.google.com/docs/firestore/security/get-started)
