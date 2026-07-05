// Supabase 초기화 (발급받은 URL과 KEY를 입력해주세요)
const SUPABASE_URL = 'https://onwvbmllypcgswfzywjv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3ZibWxscHljZ3N3Znp5d2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMDMyNzksImV4cCI6MjA5NTc3OTI3OX0.CbwhyfqCZp_jjMbHUESVzbPDAZLNV2lpniUkouqLLmQ';
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

document.addEventListener('DOMContentLoaded', () => {
    // 폼 제출 이벤트 핸들러
    const applicationForm = document.getElementById('applicationForm');
    const successUi = document.getElementById('successUi');
    
    if (applicationForm) {
        applicationForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // 기본 제출 방지
            
            const submitBtn = applicationForm.querySelector('button[type="submit"]');
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
                                company: data.company,
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
                        "이름": data.name,
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
                alert('신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // 연락처 자동 하이픈(-) 포맷팅 로직
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            let val = this.value.replace(/[^0-9]/g, '');
            if (val.length > 3 && val.length <= 7) {
                val = val.substring(0, 3) + '-' + val.substring(3);
            } else if (val.length > 7) {
                val = val.substring(0, 3) + '-' + val.substring(3, 7) + '-' + val.substring(7, 11);
            }
            this.value = val;
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
});
