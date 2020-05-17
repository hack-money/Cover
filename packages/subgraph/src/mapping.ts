import { Create } from '../generated/Hack/Options';
import { OptionStatus } from '../generated/schema';

export function handleNewOption(event: Create): void {
  let option = new OptionStatus(event.params.optionId.toHex());
  option.holder = event.params.account;
  option.save();
}

// export function handleExerciseOption(event: Exercise): void {
//   let id = event.params.id.toHex()
//   let gravatar = Gravatar.load(id)
//   if (gravatar == null) {
//     gravatar = new Gravatar(id)
//   }
//   gravatar.owner = event.params.owner
//   gravatar.displayName = event.params.displayName
//   gravatar.imageUrl = event.params.imageUrl
//   gravatar.save()
// }

// export function handleExpireOption(event: Expire): void {
//     let id = event.params.id.toHex()
//     let gravatar = Gravatar.load(id)
//     if (gravatar == null) {
//       gravatar = new Gravatar(id)
//     }
//     gravatar.owner = event.params.owner
//     gravatar.displayName = event.params.displayName
//     gravatar.imageUrl = event.params.imageUrl
//     gravatar.save()
//   }
