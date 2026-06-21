import { StatusCodes } from 'http-status-codes';
import { feeService } from '../services/FeeService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

class FeeController {
  list = asyncHandler(async (req, res) => {
    const data = await feeService.list(req.query);
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  getRecentPayments = asyncHandler(async (req, res) => {
    const data = await feeService.getRecentPayments(req.query.limit);
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  getByStudent = asyncHandler(async (req, res) => {
    const data = await feeService.getStudentFee(req.params.studentId);
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  getMine = asyncHandler(async (req, res) => {
    const data = await feeService.getMyFee(req.user._id);
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  listFeeTypes = asyncHandler(async (req, res) => {
    const data = await feeService.listFeeTypes(req.query);
    res.status(StatusCodes.OK).json({ success: true, data });
  });

  createFeeType = asyncHandler(async (req, res) => {
    const data = await feeService.createFeeType(req.body);
    res.status(StatusCodes.CREATED).json({ success: true, data, message: 'Fee type created successfully' });
  });

  deleteFeeType = asyncHandler(async (req, res) => {
    const data = await feeService.deleteFeeType(req.params.id);
    res.status(StatusCodes.OK).json({ success: true, data, message: 'Fee type deleted successfully' });
  });

  toggleFeeTypeStatus = asyncHandler(async (req, res) => {
    const data = await feeService.toggleFeeTypeStatus(req.params.id, req.body.isActive);
    res.status(StatusCodes.OK).json({ success: true, data, message: 'Fee type status updated successfully' });
  });

  bulkToggleFeeTypeStatus = asyncHandler(async (req, res) => {
    const data = await feeService.bulkToggleFeeTypeStatus(req.body.ids, req.body.isActive);
    res.status(StatusCodes.OK).json({ success: true, data, message: 'Fee types status updated successfully' });
  });

  updateFeeType = asyncHandler(async (req, res) => {
    const data = await feeService.updateFeeType(req.params.id, req.body);
    res.status(StatusCodes.OK).json({ success: true, data, message: 'Fee type updated successfully' });
  });

  bulkAssign = asyncHandler(async (req, res) => {
    const data = await feeService.bulkAssign(req.body, req.user._id);
    res.status(StatusCodes.OK).json({ success: true, data, message: 'Fee assigned successfully' });
  });

  bulkRemove = asyncHandler(async (req, res) => {
    const data = await feeService.bulkRemove(req.body);
    res.status(StatusCodes.OK).json({ success: true, data, message: 'Fee removed successfully' });
  });

  setTotalFee = asyncHandler(async (req, res) => {
    const data = await feeService.setTotalFee(req.params.studentId, req.body.totalFee);
    res.status(StatusCodes.OK).json({ success: true, data, message: 'Fee updated successfully' });
  });

  recordPayment = asyncHandler(async (req, res) => {
    const data = await feeService.recordPayment(req.params.studentId, req.body, req.user._id);
    res.status(StatusCodes.CREATED).json({ success: true, data, message: 'Payment recorded successfully' });
  });
}

export const feeController = new FeeController();
