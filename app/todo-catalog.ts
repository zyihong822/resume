// 待办展示口径：2026-11-24。示例数据仅用于原型演示。
export const todoTitles = {
  订单: ['新订单-待接单处理', '订单即将超时发货提醒', '订单超时发货提醒', '账单逾期处理', '逾期未归还', '用户归还商品待确认', '商品购买申请待处理', '用户投诉待处理', '平台拒绝处理用户投诉', '用户发票待上传', '订单超时完结提醒'],
  店铺: ['待开通数字签名', '店铺信息审核不通过待修改', '店铺违规待处理'],
};

export function getTodoExample(title: string, index: number, fullReturn = false) {
  const order = `DM20261124${String(index + 1).padStart(5, '0')}`;
  const bill = `BILL20261124${String(index + 1).padStart(4, '0')}`;
  const complaint = `TS20261124${String(index + 1).padStart(4, '0')}`;
  const violation = `WG20261124${String(index + 1).padStart(4, '0')}`;
  const product = '索尼 PS5 游戏机 双手柄套装';
  const orderParams = `orderId=${order}`;
  const common = { route: '订单列表', params: orderParams, actionLabel: '去处理', completeWhen: '' };
  switch (title) {
    case '新订单-待接单处理': return { ...common, content: `您有一笔新订单${order}，请尽快接单。`, params: `status=WAIT_ACCEPT&${orderParams}`, actionLabel: '去接单', completeWhen: '确认接单或拒绝后完结' };
    case '账单逾期处理': return { ...common, content: `您有一笔逾期账单 ${bill}，请及时处理代扣。`, route: '租赁账单', params: `status=OVERDUE&billId=${bill}`, completeWhen: '账单状态恢复正常（已代扣、线下支付）' };
    case '逾期未归还': return { ...common, content: `您有一笔订单${order}已超出归还时间，还有2件商品未归还，请尽快联系用户归还商品。`, params: `status=OVERDUE_RETURN&${orderParams}`, completeWhen: '订单中的所有在租商品全部归还' };
    case '用户归还商品待确认': return { ...common, content: fullReturn ? `您有一笔订单${order}，用户已全部归还设备，请留意归还物流信息，收货后核对商品状态并进行订单“完结”处理。` : `您有一笔订单${order}，用户已归还部分设备，请留意归还物流信息，收货后核对商品状态并操作订单“确认收货”。`, params: `status=${fullReturn ? 'RETURNING' : 'RENTING'}&${orderParams}&returnId=RETURN${index + 1}`, completeWhen: fullReturn ? '订单完结成功后完成' : '对应归还批次确认收货后完成' };
    case '商品购买申请待处理': return { ...common, content: `用户申请购买订单${order}中的商品，请尽快审核；同意购买时，请填写购买金额。`, route: '购买申请列表', params: `${orderParams}&purchaseApplicationId=BUY${index + 1}`, actionLabel: '去审核', completeWhen: '审核状态切换为已拒绝、已通过或用户已取消' };
    case '用户投诉待处理': return { ...common, content: `用户投诉${complaint}的商品质量问题，请尽快查看投诉详情，解决用户问题。`, route: '用户投诉列表', params: `complaintNo=${complaint}`, completeWhen: '投诉状态变更为除“商家待处理”外的其他状态' };
    case '平台拒绝处理用户投诉': return { ...common, content: `平台拒绝处理用户投诉 ${complaint} 的售后服务问题，拒绝原因：请商家先与用户核实并补充处理说明，请您尽快处理用户投诉。`, route: '用户投诉列表', params: `complaintNo=${complaint}`, completeWhen: '投诉状态变更为除“商家待处理”外的其他状态' };
    case '用户发票待上传': return { ...common, content: `订单${order}申请开票电子普通发票，开票期数：第2期，发票金额：299.00元，请尽快上传发票。`, route: '用户开票列表', params: `${orderParams}&invoicePeriod=2&status=WAIT_INVOICE`, actionLabel: '去开票', completeWhen: '开票完成后完结' };
    case '订单即将超时发货提醒': return { ...common, content: `您有一笔订单${order}，${product}，即将超时发货，剩余2小时30分，请及时安排发货。`, params: `status=WAIT_SHIP&${orderParams}`, actionLabel: '去发货', completeWhen: '完成发货后完结' };
    case '订单超时发货提醒': return { ...common, content: `您有一笔订单${order}，${product}，已超时发货3小时18分，请尽快安排发货。`, params: `status=WAIT_SHIP&${orderParams}`, actionLabel: '去发货', completeWhen: '完成发货后完结' };
    case '订单超时完结提醒': return { ...common, content: `您有一笔订单${order}，Apple Watch Series 10，已超时完结11小时16分，请尽快核对归还商品及订单状态，进行订单“完结”处理。`, params: `status=RETURNING&${orderParams}`, actionLabel: '去完结', completeWhen: '订单完结成功后完成' };
    case '待开通数字签名': return { ...common, content: '您的店铺已审核通过，请移步到“店铺→店铺管理→店铺信息”去开通数字签名，才能发布商品。', route: '店铺管理 / 店铺信息', params: 'dialog=DIGITAL_SIGNATURE', actionLabel: '去开通', completeWhen: '开通数字签名后完成' };
    case '店铺信息审核不通过待修改': return { ...common, content: '您的店铺审核不通过，请移步到“店铺→店铺管理→店铺信息”去修改企业信息，重新提交审核。', route: '店铺管理 / 店铺信息', params: 'status=AUDIT_REJECTED', actionLabel: '去审核', completeWhen: '重新提交审核后完成' };
    case '店铺违规待处理': return { ...common, content: `您的店铺因“报价不规范”被判定为二级处罚。处罚内容：罚款200元、扣除商家分2分、限制提现。违规单号：${violation}，请及时申诉或支付罚款。`, route: '店铺管理 / 违规列表 / 违规详情', params: `violationNo=${violation}`, completeWhen: '提交申诉或者支付罚款后完成' };
    default: throw new Error(`未定义的待办类型：${title}`);
  }
}
