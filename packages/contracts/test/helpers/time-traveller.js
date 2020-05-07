const advanceTime = (provider, time) => {
  return provider.send('evm_increaseTime', [time])
}

const advanceBlock = (provider) => {
    return provider.send('evm_mine', [])
}

const advanceBlockAndSetTime = (provider, time) => {
    return provider.send('evm_mine', [time])
}

const advanceTimeAndBlock = async (provider, time) => {
    // capture current time
    const block = await provider.getBlock('latest')
    const forwardTime = block.timestamp + time
    return provider.send('evm_mine', [forwardTime])
}

const takeSnapshot = (provider) => {
    return provider.send('evm_snapshot', [])
}

const revertToSnapshot = (provider, id) => {
    return provider.send('evm_revert', [id])
}

module.exports = {
  advanceTime,
  advanceBlock,
  advanceBlockAndSetTime,
  advanceTimeAndBlock,
  takeSnapshot,
  revertToSnapshot
}
