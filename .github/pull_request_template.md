# PR Details

<!--- Provide a general summary of your changes in the Title above -->
Fix bugs:
 - r.findImpl is not a function
 - ready event doesn't work

## Description

It was not possible to send messages to new conversations by accounts whatsapp business returned this error: "r.findImpl is not a function"

The ready event was not working making it impossible to send messages
<!--- Describe your changes in detail -->

## Related Issue

<!--- Optional --->
<!--- If there is an issue link it here: -->

## Motivation and Context

<!--- Optional --->
<!--- Why is this change required? What problem does it solve? -->

## How Has This Been Tested

<!--- Please describe in detail how you tested your changes. -->
<!--- Include details of your testing environment, and the tests you ran to -->

## Types of changes

<!--- What types of changes does your code introduce? Put an `x` in all the boxes that apply: -->

- [ ] Dependency change
- [x] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)

## Checklist

<!--- Go over all the following points, and put an `x` in all the boxes that apply. -->

- [x] My code follows the code style of this project.
- [x] I have updated the documentation accordingly (index.d.ts).



