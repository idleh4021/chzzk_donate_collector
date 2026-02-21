import asyncio
import json
import requests
import websockets
import threading
import os
from datetime import datetime
from dotenv import load_dotenv
import random

class AppAPI:
    def __init__(self):
        self.is_running = False
        self._loop = None
        self._window = None
        self.target_amount = 0
        self.match_type = None
        self.allow_remainder = False
        
    def set_window(self, window):
        self._window = window
        
    def start_collection(self, channel_id,options):
        self.target_amount = options.get('targetAmount',0)
        self.match_type = options.get('matchType','above') # 'exact','above'
        self.allow_remainder = options.get('allowRemainder',True)
        #load_dotenv()
        if(random.random() < 0.1):
            title = os.getenv('SECRET_TITLE')
            self._window.set_title(title)
        if self.is_running:
            return '이미 실행 중입니다.'
        
        self.is_running = True
        # 데몬 스레드로 실행하여 프로그램 종료 시 같이 종료되도록 함
        threading.Thread(target=self._run_websocket_loop, args=(channel_id,), daemon=True).start()
        return '수집을 시작합니다'
    
    def stop_collection(self):
        self.is_running = False
        title = os.getenv('ORIGINAL_TITLE')
        if(self._window.title!= title):
            self._window.set_title(title)
        return '수집을 중지합니다'

    def _format_time(self, timestamp_ms):
        """밀리초 타임스탬프를 읽기 쉬운 시간으로 변환"""
        if not timestamp_ms: return ""
        return datetime.fromtimestamp(timestamp_ms / 1000.0).strftime('%H:%M:%S')
    
    def _run_websocket_loop(self, channel_id):
        # 새 이벤트 루프 생성
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        try:
            self._loop.run_until_complete(self._collect_donations(channel_id))
        except Exception as e:
            print(f"루프 실행 오류: {e}")
        finally:
            self._loop.close()
            
    def isPassDonation(self, amount):
        if self.target_amount > amount:
            return False
        if self.match_type =='exact' and self.target_amount != amount:
            return False
        if not self.allow_remainder and amount % self.target_amount != 0:
            return False
        return True
            
        
    async def _collect_donations(self, channel_id):
        try:
            # 1. 채널 정보 및 토큰 획득
            url = f'https://api.chzzk.naver.com/polling/v2/channels/{channel_id}/live-status'
            res = requests.get(url).json()
            chat_channel_id = res['content']['chatChannelId']
            
            token_url = f'https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId={chat_channel_id}&chatType=STREAMING'
            token_res = requests.get(token_url).json()
            token = token_res['content']['accessToken']
            
            server_id = (ord(chat_channel_id[0]) + ord(chat_channel_id[-1])) % 3 + 1
            ws_url = f'wss://kr-ss{server_id}.chat.naver.com/chat'
        except Exception as e:
            print(f'인증 정보 가져오기 실패 : {e}')
            self.is_running = False
            return
    
        async with websockets.connect(ws_url) as ws:
            connect_pkt = {
                "ver": "2", "cmd": 100, "svcid": "game", "cid": chat_channel_id,
                "bdy": {"uid": None, "devType": 2001, "accTkn": token, "auth": "READ"},
                "tid": 1
            }
            await ws.send(json.dumps(connect_pkt))
            
            while self.is_running:
                try:
                    raw_data = await asyncio.wait_for(ws.recv(), timeout=1.0)
                    data = json.loads(raw_data)

                    # 1. cmd 확인
                    cmd = data.get("cmd")
                    
                    # 2. bdy가 리스트 형태인지 안전하게 확인
                    body_list = data.get('bdy')
                    if not body_list or not isinstance(body_list, list):
                        # Ping-Pong 처리 (cmd가 0인 경우)
                        if cmd == 0:
                            await ws.send(json.dumps({"ver": "2", "cmd": 10000}))
                        continue

                    # 3. 후원 전용 커맨드 93102 처리
                    if cmd == 93102:
                    #if cmd == 93101:
                        for msg in body_list:
                            if not msg: continue
                            if msg.get('msgTypeCode') != 10 : continue # 미션,구독 제외
                            try:
                                # extras 추출 및 파싱
                                extras_raw = msg.get('extras')
                                if not extras_raw: continue
                                
                                extras = json.loads(extras_raw) if isinstance(extras_raw, str) else extras_raw
                                pay_amount = extras.get('payAmount')
                                
                                if(not self.isPassDonation(pay_amount)):
                                    continue
                                    #profile_raw = msg.get('profile', '{}')
                                    #profile = json.loads(profile_raw) if isinstance(profile_raw, str) else profile_raw
                                profile_raw = msg.get('profile')
                                nickname = '익명'
                                
                                if profile_raw:
                                    profile = json.loads(profile_raw) if isinstance(profile_raw,str) else profile_raw
                                    nickname = profile.get('nickname', '익명')
                                
                                donation_info = {
                                    'nickname': nickname,
                                    'amount': pay_amount,
                                    'message': msg.get('msg', '').strip(),
                                    'time': self._format_time(msg.get('msgTime'))
                                }
                                
                                print(f"[💰 후원 발생] {donation_info['time']} {donation_info['nickname']}: ({donation_info['amount']}치즈) {donation_info['message']}" )

                                if self._window:
                                    js_payload = json.dumps(donation_info)
                                    # React 호출
                                    self._window.evaluate_js(f"if(window.addDonation) {{ window.addDonation({js_payload}); }}")
                            except Exception as inner_e:
                                # 메시지 하나 파싱 실패해도 루프는 계속 돌도록 함
                                print(f"[*] 메시지 파싱 중 스킵 : {inner_e}")
                                continue

                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    # 'NoneType' 에러가 여기서 잡힐 텐데, 어떤 데이터 때문인지 출력해봅니다.
                    print(f'[*] 루프 내부 오류 발생 (무시하고 계속): {e}')
                    continue

    def greet(self, name):
        return f'안녕, {name} 백엔드 응답이야'