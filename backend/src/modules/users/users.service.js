const usersRepo = require('./users.repository');
const { NotFoundError } = require('../../shared/errors/AppError');

async function getMyProfile(userId) {
  const user = await usersRepo.getProfile(userId);
  if (!user) {
    throw new NotFoundError('User');
  }
  return user;
}

async function updateMyProfile(userId, updateData) {
  // Business rule: we don't allow changing email here. 
  // Changing email requires a complex verification flow.
  const updatedUser = await usersRepo.updateProfile(userId, {
    firstName: updateData.firstName,
    lastName: updateData.lastName
  });

  return updatedUser;
}

async function getMyAddresses(userId) {
  return await usersRepo.getAddressesByUserId(userId);
}

async function addAddress(userId, addressData) {
  // If the user wants this new address to be their default,
  // we must first remove the default status from all their other addresses.
  if (addressData.isDefault) {
    await usersRepo.removeDefaultStatus(userId);
  }

  // If this is their very first address, we force it to be default
  const existingAddresses = await usersRepo.getAddressesByUserId(userId);
  if (existingAddresses.length === 0) {
    addressData.isDefault = true;
  }

  const newAddress = await usersRepo.createAddress(userId, addressData);
  return newAddress;
}

async function getAllUsers() {
  return await usersRepo.getAllUsers();
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  getMyAddresses,
  addAddress,
  getAllUsers
};
