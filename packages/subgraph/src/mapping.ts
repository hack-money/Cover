import { Create, Exercise, Expire } from '../generated/Cover/Options';
import { Option } from '../generated/schema';

export function handleNewOption(event: Create): void {
  let optionCreation = new Option(event.params.optionId.toHex());
  optionCreation.holder = event.params.account;
  optionCreation.save();
}

export function handleExerciseOption(event: Exercise): void {
  const id = event.params.optionId.toHex();
  let option = Option.load(id);
  option.exercised = true;
  option.exchangeAmount = event.params.exchangeAmount;
  option.save();
}

export function handleExpireOption(event: Expire): void {
  const id = event.params.optionId.toHex();
  let option = Option.load(id);
  option.expired = true;
  option.save();
}
