// TikFinity Desktop Event API only. No direct TikTok connector and no S2E.
export function normalize(packet){
 if(!packet||typeof packet!=='object'||!packet.data||typeof packet.data!=='object'||Array.isArray(packet.data))throw Error('Invalid TikFinity envelope');
 const d=packet.data,g=d.gift||{},u=d.user||{};
 return {event:packet.event,data:{...d,uniqueId:d.uniqueId||u.uniqueId||u.displayId||d.userId||u.userId||'Anonymous',msgId:d.msgId||d.eventId||d.common?.msgId,giftName:d.giftName||g.name||d.giftDetails?.giftName,giftType:d.giftType??g.type??d.giftDetails?.giftType,repeatCount:d.repeatCount??d.comboCount??1,likeCount:d.likeCount??d.count??1}};
}
