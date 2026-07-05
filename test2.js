
        try {
            // Supabase 초기화 (발급받은 URL과 KEY를 입력해주세요)
            const SUPABASE_URL = 'https://onwvbmllypcgswfzywjv.supabase.co';
            const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3ZibWxscHljZ3N3Znp5d2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMDMyNzksImV4cCI6MjA5NTc3OTI3OX0.CbwhyfqCZp_jjMbHUESVzbPDAZLNV2lpniUkouqLLmQ';
            const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

        // URL에 남아있는 쿼리 파라미터(이름, 이메일 등)가 있다면 깔끔하게 지워줌
        if (window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // 폼 제출 이벤트 핸들러
        const applicationForm = document.getElementById('applicationForm');
        const successUi = document.getElementById('successUi');
        const submitBtn = document.getElementById('submitBtn');
        
        if (submitBtn && applicationForm) {
            submitBtn.addEventListener('click', async (e) => {
                if (!applicationForm.checkValidity()) {
                    applicationForm.reportValidity(); // 기본 HTML 툴팁
                    alert("모든 필수 항목(성별 포함)을 정확히 입력해 주세요!"); // 툴팁이 안 보이는 브라우저 대비 명시적 경고
                    return;
                }
                
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '처리 중...';
                submitBtn.disabled = true;
                
                const formData = new FormData(applicationForm);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    if(supabase) {
                        // Supabase 연동 시도
                        const { error } = await supabase
                            .from('baromannam_beta_testers')
                            .insert([
                                { 
                                    name: data.name, 
                                    gender: data.gender,
                                    company: data.company,
                                    birthdate: data.birthdate,
                                    location: data.location,
                                    email: data.email,
                                    phone: data.phone, 
                                    service_type: data.service_type 
                                }
                            ]);
                            
                        if (error) throw error;
                    } else {
                        console.log('Supabase 클라이언트가 초기화되지 않았습니다. 임시 성공 처리:', data);
                    }
                    
                    // 성공 UI 전환
                    applicationForm.classList.add('hidden');
                    successUi.classList.remove('hidden');

                    // 2. 관리자 이메일 자동 알림 발송 (formsubmit.co AJAX API 사용)
                    // 이메일 전송은 백그라운드에서 실행되도록 await 하지 않음
                    fetch("https://formsubmit.co/ajax/contact@multimove.co.kr", {
                        method: "POST",
                        headers: { 
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            _subject: "🚀 [바로만남] 새로운 베타 테스터 신청이 접수되었습니다!",
                            _autoresponse: "바로만남 베타 테스터 신청이 완료되었습니다!\n\n관심을 가져주셔서 감사합니다.\n초기 테스터로 선정되시면 본 이메일이나 연락처로 개별 안내를 드릴 예정입니다.\n\n앱 출시 전, '바로알바' 앱을 먼저 설치하시고 생태계를 미리 경험해 보세요!\n👉 앱 설치하러 가기: https://baroalba.multimove.co.kr",
                            "이름": data.name,
                            "성별": data.gender === 'male' ? '남성' : '여성',
                            "생년월일": data.birthdate,
                            "직장명": data.company,
                            "지역": data.location === 'gangnam' ? '강남권' : 
                                    data.location === 'jongno' ? '종로/중구권' : 
                                    data.location === 'yeouido' ? '여의도권' : 
                                    data.location === 'pangyo' ? '판교/분당권' : 
                                    data.location === 'guro' ? '구로/가산권' : '기타 지역',
                            "이메일": data.email,
                            "연락처": data.phone,
                            "관심 서비스": data.service_type === 'baro_meeting' ? '바로미팅' : 
                                        data.service_type === 'baro_spot' ? '바로스팟' : '둘 다'
                        })
                    }).then(response => console.log('이메일 알림 전송 요청됨', response.status))
                    .catch(err => console.error('이메일 알림 전송 실패', err));
                    
                    // 3초 후 앱으로 자동 이동
                    setTimeout(() => {
                        window.location.href = "https://baroalba.multimove.co.kr";
                    }, 3000);
                    
                } catch (error) {
                    console.error('Supabase 전송 오류:', error);
                    alert('신청 처리 중 오류가 발생했습니다.\n상세: ' + (error.message || JSON.stringify(error)));
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        }

        // 연락처 자동 하이픈(-) 포맷팅 로직 (자동완성 대응 위해 여러 이벤트 리스닝)
        const formatPhone = function (inputElem) {
            let val = inputElem.value.replace(/[^0-9]/g, '');
            if (val.length > 3 && val.length <= 7) {
                val = val.substring(0, 3) + '-' + val.substring(3);
            } else if (val.length > 7) {
                val = val.substring(0, 3) + '-' + val.substring(3, 7) + '-' + val.substring(7, 11);
            }
            inputElem.value = val;
        };
        
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            ['input', 'change', 'blur'].forEach(evt => {
                phoneInput.addEventListener(evt, function (e) {
                    formatPhone(this);
                });
            });
        }

        // 생년월일 숫자만 입력되도록 강제 (8자리 제한은 HTML maxlength=8로 처리)
        const birthdateInput = document.getElementById('birthdate');
        if (birthdateInput) {
            ['input', 'change', 'blur'].forEach(evt => {
                birthdateInput.addEventListener(evt, function (e) {
                    this.value = this.value.replace(/[^0-9]/g, '');
                });
            });
        }

        // 스무스 스크롤 네비게이션
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if(targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if(targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
        } catch(err) {
            alert("스크립트 초기화 오류: " + err.message);
        }
    