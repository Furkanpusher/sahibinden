from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.exceptions import ValidationError

# Create your models here.


# AbstractUser attributes are not enough, so we'll override it to add some functionalites to it

# if I use abstractbaseuser, I gotta define every field such as password etc.
class CustomUser(AbstractUser):
    # but using AbstractUser: Username, first_name, last_name, email, password,
    # last_login, is_superuser, is_staff, is_active, date_joined

    phone_number = models.CharField(max_length=15, blank=True)
    profile_picture = models.ImageField(
        upload_to='profile_pictures/', blank=True,  null=True)


class Follow(models.Model):
    # The person who clicks "Follow"
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        # user.following.all() -> all follow records where user is the follower
        related_name="following"
    )
    # The seller being followed
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        # seller.followers.all() -> all follow records where user is being followed
        related_name="followers"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("follower", "seller")
        ordering = ["-created_at"]
        constraints = [
            # Database-level constraint preventing a user from following themselves
            models.CheckConstraint(
                check=~models.Q(follower=models.F("seller")),
                # means CHECK (follower_id <> seller_id)
                name="prevent_self_follow"
            )
        ]

    def clean(self):
        if self.follower == self.seller:
            raise ValidationError("You cannot follow yourself.")

    def __str__(self):
        return f"{self.follower.username} follows {self.seller.username}"
