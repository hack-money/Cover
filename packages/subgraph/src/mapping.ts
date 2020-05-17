import { Create, Exercise, Expire } from '../generated/Hack/Options';
import { OptionCreation, OptionExercise, OptionExpiry } from '../generated/schema';

export function handleNewOption(event: Create): void {
  let optionCreation = new OptionCreation(event.params.optionId.toHex());
  optionCreation.holder = event.params.account;
  optionCreation.save();
}

export function handleExerciseOption(event: Exercise): void {
  const optionExercise = new OptionExercise(event.params.optionId.toHex());
  optionExercise.save();
}

export function handleExpireOption(event: Expire): void {
  const optionExpiry = new OptionExpiry(event.params.optionId.toHex());
  optionExpiry.save();
}
